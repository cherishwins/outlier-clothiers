import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { productName, amount } = await request.json()

    console.log("[v0] Creating Coinbase Commerce charge for:", { productName, amount })

    // Coinbase Commerce API integration
    // Get API key from environment: process.env.COINBASE_COMMERCE_API_KEY
    const response = await fetch("https://api.commerce.coinbase.com/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY || "",
        "X-CC-Version": "2018-03-22",
      },
      body: JSON.stringify({
        name: productName,
        description: `OUTLIER CLOTHIERS - ${productName}`,
        pricing_type: "fixed_price",
        local_price: {
          amount: amount,
          currency: "USD",
        },
        metadata: {
          product: productName,
          source: "outlier-telegram",
        },
      }),
    })

    const data = await response.json()
    console.log("[v0] Coinbase charge created:", data)

    return NextResponse.json({
      success: true,
      charge_id: data.data.id,
      hosted_url: data.data.hosted_url,
    })
  } catch (error) {
    console.error("Coinbase payment error:", error)
    return NextResponse.json({ success: false, error: "Payment failed" }, { status: 500 })
  }
}
