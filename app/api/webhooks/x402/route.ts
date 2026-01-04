import { type NextRequest, NextResponse } from "next/server"
import { verifyPaymentOnChain } from "@/lib/payment-verification"

// x402 Protocol webhook handler
// Called by x402-compatible wallets after payment is made on-chain

interface X402PaymentCallback {
  // Transaction details
  txHash: string
  network: "base" | "base-sepolia"
  
  // Payment details
  amount: string // In smallest unit (USDC has 6 decimals)
  currency: string
  recipient: string
  
  // Order metadata (passed through from original payment request)
  metadata: {
    dropId: number
    quantity: number
    customerWallet: string
    customerEmail?: string
    shippingAddress?: string
    orderId?: string
  }
  
  // Signature for verification (optional, depends on implementation)
  signature?: string
}

export async function POST(request: NextRequest) {
  try {
    const payload: X402PaymentCallback = await request.json()
    
    console.log("[x402 Webhook] Received payment callback:", {
      txHash: payload.txHash,
      amount: payload.amount,
      metadata: payload.metadata,
    })

    // Verify the payment on-chain
    const isTestnet = payload.network === "base-sepolia"
    const verification = await verifyPaymentOnChain({
      txHash: payload.txHash as `0x${string}`,
      expectedAmount: BigInt(payload.amount),
      expectedRecipient: payload.recipient as `0x${string}`,
      isTestnet,
    })

    if (!verification.verified) {
      console.error("[x402 Webhook] Payment verification failed:", verification.error)
      return NextResponse.json(
        { 
          success: false, 
          error: "Payment verification failed",
          details: verification.error 
        },
        { status: 400 }
      )
    }

    console.log("[x402 Webhook] Payment verified on-chain:", {
      txHash: payload.txHash,
      actualAmount: verification.actualAmount,
      sender: verification.sender,
    })

    // Import settlement service dynamically
    const { settleOrder } = await import("@/lib/settlement")

    // Parse shipping address
    let shippingAddress = {}
    if (payload.metadata.shippingAddress) {
      try {
        shippingAddress = JSON.parse(payload.metadata.shippingAddress)
      } catch {
        shippingAddress = { raw: payload.metadata.shippingAddress }
      }
    }

    // Settle the order
    const order = await settleOrder({
      dropId: payload.metadata.dropId,
      quantity: payload.metadata.quantity,
      customerWallet: payload.metadata.customerWallet || verification.sender!,
      customerEmail: payload.metadata.customerEmail,
      shippingAddress,
      paymentMethod: "x402",
      paymentTxHash: payload.txHash,
      paymentAmount: Number(payload.amount) / 1_000_000, // Convert from USDC smallest unit
    })

    console.log("[x402 Webhook] Order settled:", order.id)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      receiptNftId: order.receipt_nft_id,
    })
  } catch (error) {
    console.error("[x402 Webhook] Error processing callback:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

// Endpoint to verify a payment manually (useful for debugging)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const txHash = searchParams.get("txHash")
  
  if (!txHash) {
    return NextResponse.json({
      status: "x402 Payment Webhook Active",
      usage: "POST to submit payment callback, GET with ?txHash=0x... to verify payment",
      timestamp: new Date().toISOString(),
    })
  }

  // Verify payment on-chain
  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"
  const verification = await verifyPaymentOnChain({
    txHash: txHash as `0x${string}`,
    isTestnet,
  })

  return NextResponse.json({
    txHash,
    verification,
  })
}
