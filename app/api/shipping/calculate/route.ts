import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { to_address, weight_oz = 16 } = await request.json()

    // EasyPost integration would go here
    // For now, return estimated rates based on zones

    const { zip, country } = to_address

    // Simple zone-based pricing (replace with real EasyPost API)
    let shipping_cost = 12.0 // Base rate USD

    if (country !== "US" && country !== "CA") {
      shipping_cost = 25.0 // International
    } else if (weight_oz > 32) {
      shipping_cost = 18.0 // Heavy package
    }

    return NextResponse.json({
      success: true,
      shipping_cost,
      estimated_days: country === "US" || country === "CA" ? "3-5" : "7-14",
      carrier: "USPS Priority",
    })
  } catch (error) {
    console.error("Shipping calculation error:", error)
    return NextResponse.json({ success: false, error: "Shipping calculation failed" }, { status: 500 })
  }
}
