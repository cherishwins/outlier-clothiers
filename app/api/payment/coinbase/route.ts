import { type NextRequest, NextResponse } from "next/server"

interface CoinbasePaymentRequest {
  productName: string
  amount: number | string
  // Order metadata
  dropId?: number
  quantity?: number
  boxType?: "small" | "medium" | "large"
  customerWallet?: string
  customerEmail?: string
  shippingAddress?: object
}

export async function POST(request: NextRequest) {
  try {
    const body: CoinbasePaymentRequest = await request.json()
    const {
      productName,
      amount,
      dropId,
      quantity,
      boxType,
      customerWallet,
      customerEmail,
      shippingAddress,
    } = body

    const apiKey = process.env.COINBASE_COMMERCE_API_KEY
    if (!apiKey) {
      console.error("[Coinbase] Missing COINBASE_COMMERCE_API_KEY")
      return NextResponse.json(
        { success: false, error: "Payment service not configured" },
        { status: 500 }
      )
    }

    console.log("[Coinbase] Creating charge:", { productName, amount })

    // Build redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://outlierclothiers.com"
    const redirectUrl = `${baseUrl}/orders/success`
    const cancelUrl = `${baseUrl}/drops`

    // Create Coinbase Commerce charge
    const response = await fetch("https://api.commerce.coinbase.com/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": apiKey,
        "X-CC-Version": "2018-03-22",
      },
      body: JSON.stringify({
        name: productName,
        description: `OUTLIER CLOTHIERS - ${productName}`,
        pricing_type: "fixed_price",
        local_price: {
          amount: amount.toString(),
          currency: "USD",
        },
        // Metadata passed to webhook
        metadata: {
          drop_id: dropId?.toString() || "0",
          quantity: quantity?.toString() || "1",
          box_type: boxType || "medium",
          customer_wallet: customerWallet || "",
          customer_email: customerEmail || "",
          shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : "",
          source: "outlier-clothiers",
        },
        redirect_url: redirectUrl,
        cancel_url: cancelUrl,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Coinbase] API error:", response.status, errorText)
      return NextResponse.json(
        { success: false, error: "Failed to create payment" },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log("[Coinbase] Charge created:", data.data.id)

    return NextResponse.json({
      success: true,
      charge_id: data.data.id,
      hosted_url: data.data.hosted_url,
      expires_at: data.data.expires_at,
      pricing: data.data.pricing,
    })
  } catch (error) {
    console.error("[Coinbase] Payment error:", error)
    return NextResponse.json(
      { success: false, error: "Payment failed" },
      { status: 500 }
    )
  }
}

// GET endpoint for charge status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const chargeId = searchParams.get("chargeId")

  if (!chargeId) {
    return NextResponse.json({
      status: "Coinbase Commerce Payment API Active",
      usage: {
        POST: "Create payment charge",
        GET: "Check charge status with ?chargeId=xxx",
      },
    })
  }

  const apiKey = process.env.COINBASE_COMMERCE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Payment service not configured" },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://api.commerce.coinbase.com/charges/${chargeId}`,
      {
        headers: {
          "X-CC-Api-Key": apiKey,
          "X-CC-Version": "2018-03-22",
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Charge not found" },
        { status: 404 }
      )
    }

    const data = await response.json()
    const charge = data.data

    // Determine payment status
    const timeline = charge.timeline || []
    const lastStatus = timeline[timeline.length - 1]?.status || "NEW"

    return NextResponse.json({
      chargeId: charge.id,
      status: lastStatus,
      hosted_url: charge.hosted_url,
      pricing: charge.pricing,
      payments: charge.payments,
      metadata: charge.metadata,
    })
  } catch (error) {
    console.error("[Coinbase] Status check error:", error)
    return NextResponse.json(
      { error: "Failed to get charge status" },
      { status: 500 }
    )
  }
}
