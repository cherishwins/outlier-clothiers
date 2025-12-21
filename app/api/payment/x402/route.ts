import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { productName, amount } = await request.json()

    // x402 HTTP 402 Payment Required flow
    // Return payment instructions
    return NextResponse.json(
      {
        product: productName,
        amount: amount,
        currency: "USDC",
        address: process.env.X402_PAYMENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        network: "base",
        instructions: "Send USDC on Base network to complete purchase",
      },
      { status: 402 }, // HTTP 402 Payment Required
    )
  } catch (error) {
    console.error("x402 payment error:", error)
    return NextResponse.json({ success: false, error: "Payment failed" }, { status: 500 })
  }
}
