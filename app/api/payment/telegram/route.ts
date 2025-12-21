import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { productName, stars, ton } = await request.json()

    // Telegram payment integration
    // This would integrate with Telegram Bot API for Stars/TON payments
    // For now, return payment link

    return NextResponse.json({
      success: true,
      payment_url: `https://t.me/OutlierClothiersBot?start=pay_${stars}_${encodeURIComponent(productName)}`,
      stars,
      ton,
    })
  } catch (error) {
    console.error("Telegram payment error:", error)
    return NextResponse.json({ success: false, error: "Payment failed" }, { status: 500 })
  }
}
