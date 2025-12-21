import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { order_id, to_address } = await request.json()

    // EasyPost shipment creation
    // const easypost = new Easypost(process.env.EASYPOST_API_KEY)
    //
    // const shipment = await easypost.Shipment.create({
    //   from_address: WAREHOUSE_ADDRESS,
    //   to_address,
    //   parcel: { weight: 16 }
    // })
    //
    // await shipment.buy(shipment.lowestRate())

    // Placeholder response
    const tracking_number = `1Z999AA1${Math.random().toString(36).substring(7).toUpperCase()}`
    const label_url = `https://easypost.com/labels/${tracking_number}.pdf`

    // Update database
    // await prisma.order.update({
    //   where: { id: order_id },
    //   data: {
    //     tracking_number,
    //     shipping_label_url: label_url,
    //     carrier: "USPS",
    //     status: "shipped",
    //     shipped_at: new Date()
    //   }
    // })

    return NextResponse.json({
      success: true,
      tracking_number,
      label_url,
      carrier: "USPS",
    })
  } catch (error) {
    console.error("Label creation error:", error)
    return NextResponse.json({ success: false, error: "Label creation failed" }, { status: 500 })
  }
}
