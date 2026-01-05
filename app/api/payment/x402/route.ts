import { type NextRequest, NextResponse } from "next/server"
import { CONTRACTS, parseUSDC } from "@/lib/contracts"
import { quoteDrop } from "@/lib/pricing"

// x402 HTTP 402 Payment Required flow
// Spec: https://github.com/coinbase/x402

interface PaymentRequestBody {
  // Product details
  productName: string
  amount: number // In USD (ignored — computed server-side from contract)
  
  // Order metadata
  dropId?: number
  quantity?: number
  boxType?: "small" | "medium" | "large"
  
  // Customer info (optional, can be provided at checkout)
  customerWallet?: string
  customerEmail?: string
  shippingAddress?: object
}

interface X402PaymentRequest {
  // x402 spec fields
  version: "1"
  network: "base" | "base-sepolia"
  
  // Payment details
  paymentRequirements: {
    scheme: "exact"
    currency: "USDC"
    amount: string // Amount in smallest unit (6 decimals for USDC)
    recipient: string // Contract or wallet address
    description: string
  }
  
  // Callback for payment confirmation
  callbackUrl: string
  
  // Metadata to include in callback
  metadata: {
    dropId: number
    quantity: number
    productName: string
    boxType?: string
    customerEmail?: string
    shippingAddress?: string
  }
  
  // Additional info
  expiresAt?: string // ISO timestamp
  memo?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequestBody = await request.json()
    const { productName, dropId, quantity, boxType, customerEmail, shippingAddress } = body

    const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"
    const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base
    const network = isTestnet ? "base-sepolia" : "base"

    const resolvedDropId = dropId ?? 0
    const resolvedQuantity = quantity ?? 1

    if (!Number.isFinite(resolvedDropId) || resolvedDropId <= 0) {
      return NextResponse.json(
        { success: false, error: "dropId is required" },
        { status: 400 }
      )
    }

    // Calculate amount in USDC smallest unit (6 decimals) from contract slot price
    const quote = await quoteDrop({
      dropId: resolvedDropId,
      quantity: resolvedQuantity,
      isTestnet,
    })
    const amountInSmallestUnit = quote.totalUsdc.toString()

    // Build callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://outlierclothiers.com"
    const callbackUrl = `${baseUrl}/api/webhooks/x402`

    // Build x402 payment request
    const paymentRequest: X402PaymentRequest = {
      version: "1",
      network,
      paymentRequirements: {
        scheme: "exact",
        currency: "USDC",
        amount: amountInSmallestUnit,
        recipient: contracts.flashCargo || process.env.X402_PAYMENT_ADDRESS || "",
        description: `OUTLIER CLOTHIERS - ${productName}`,
      },
      callbackUrl,
      metadata: {
        dropId: resolvedDropId,
        quantity: resolvedQuantity,
        productName,
        boxType,
        customerEmail,
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : undefined,
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      memo: `Mystery Box: ${productName}`,
    }

    // Return 402 Payment Required with x402 headers
    const response = NextResponse.json(paymentRequest, { status: 402 })

    // Set x402 headers
    response.headers.set("X-Payment-Request", JSON.stringify(paymentRequest.paymentRequirements))
    response.headers.set("X-Payment-Network", network)
    response.headers.set("X-Payment-Currency", "USDC")
    response.headers.set("X-Payment-Amount", amountInSmallestUnit)
    response.headers.set("X-Payment-Recipient", paymentRequest.paymentRequirements.recipient)
    response.headers.set("X-Payment-Callback", callbackUrl)

    return response
  } catch (error) {
    console.error("[x402] Payment request error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create payment request" },
      { status: 500 }
    )
  }
}

// GET endpoint for payment status check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("orderId")

  if (!orderId) {
    // Return API info
    const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"
    const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base

    return NextResponse.json({
      status: "x402 Payment API Active",
      network: isTestnet ? "base-sepolia" : "base",
      recipient: contracts.flashCargo,
      currency: "USDC",
      usage: {
        POST: "Create payment request",
        GET: "Check payment status with ?orderId=xxx",
      },
      example: {
        productName: "Medium Mystery Box",
        amount: 35,
        dropId: 1,
        quantity: 1,
        boxType: "medium",
      },
    })
  }

  // Check order status
  try {
    const { getOrder } = await import("@/lib/settlement")
    const order = await getOrder(orderId)

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      paymentMethod: order.payment_method,
      paymentTxHash: order.payment_tx_hash,
      receiptNftId: order.receipt_nft_id,
      paidAt: order.paid_at,
    })
  } catch (error) {
    console.error("[x402] Order status error:", error)
    return NextResponse.json(
      { error: "Failed to get order status" },
      { status: 500 }
    )
  }
}
