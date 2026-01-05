import { type NextRequest, NextResponse } from "next/server"
import { quoteDrop } from "@/lib/pricing"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

interface TelegramPaymentRequest {
  productName: string
  stars?: number // Price in Telegram Stars (ignored — computed server-side)
  ton?: number // Optional TON price
  // Order metadata
  dropId?: number
  quantity?: number
  boxType?: "small" | "medium" | "large"
  customerTelegramId?: number
  customerEmail?: string
  shippingAddress?: object
}

// Box prices in Stars (1 Star ≈ $0.01)
const BOX_PRICES_STARS = {
  small: 1500, // $15
  medium: 3500, // $35
  large: 7000, // $70
}

export async function POST(request: NextRequest) {
  try {
    const body: TelegramPaymentRequest = await request.json()
    const {
      productName,
      dropId,
      quantity = 1,
      boxType = "medium",
      customerTelegramId,
      customerEmail,
      shippingAddress,
    } = body

    const resolvedDropId = dropId ?? 0
    const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"

    if (!Number.isFinite(resolvedDropId) || resolvedDropId <= 0) {
      return NextResponse.json(
        { success: false, error: "dropId is required" },
        { status: 400 }
      )
    }

    // Calculate total Stars from contract slot price (fallback to static mapping)
    let totalStars: number
    try {
      const quote = await quoteDrop({ dropId: resolvedDropId, quantity, isTestnet })
      totalStars = quote.totalStars
    } catch (error) {
      console.warn("[Telegram] Falling back to static Stars pricing:", error)
      totalStars = BOX_PRICES_STARS[boxType] * quantity
    }

    // Build invoice payload (will be passed back in webhook)
    const invoicePayload = JSON.stringify({
      dropId: resolvedDropId,
      quantity,
      boxType,
      customerTelegramId,
      customerEmail,
      shippingAddress,
      expectedStars: totalStars,
    })

    // If we have a Telegram user ID, create an invoice link
    if (customerTelegramId && BOT_TOKEN) {
      const invoiceLink = await createTelegramInvoice({
        chatId: customerTelegramId,
        title: productName,
        description: `OUTLIER CLOTHIERS Mystery Box - ${boxType.toUpperCase()} (${quantity}x)`,
        payload: invoicePayload,
        currency: "XTR", // Telegram Stars
        prices: [{ label: productName, amount: totalStars }],
      })

      if (invoiceLink) {
        return NextResponse.json({
          success: true,
          payment_type: "stars",
          invoice_url: invoiceLink,
          stars: totalStars,
        })
      }
    }

    // Fallback: Return bot deep link for manual payment
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "OutlierClothiersBot"
    const paymentUrl = `https://t.me/${botUsername}?start=pay_${boxType}_${quantity}_${dropId || 0}`

    return NextResponse.json({
      success: true,
      payment_type: "deeplink",
      payment_url: paymentUrl,
      stars: totalStars,
      instructions: "Open the link in Telegram to complete payment with Stars",
    })
  } catch (error) {
    console.error("[Telegram] Payment error:", error)
    return NextResponse.json(
      { success: false, error: "Payment failed" },
      { status: 500 }
    )
  }
}

// Create Telegram invoice using Bot API
async function createTelegramInvoice(params: {
  chatId: number
  title: string
  description: string
  payload: string
  currency: string
  prices: Array<{ label: string; amount: number }>
}): Promise<string | null> {
  if (!BOT_TOKEN) return null

  try {
    // Create invoice link
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: params.title,
          description: params.description,
          payload: params.payload,
          provider_token: "", // Empty for Telegram Stars
          currency: params.currency,
          prices: params.prices,
          need_shipping_address: true,
          need_email: true,
          is_flexible: false,
        }),
      }
    )

    const data = await response.json()
    if (data.ok) {
      return data.result
    }

    console.error("[Telegram] Invoice creation failed:", data)
    return null
  } catch (error) {
    console.error("[Telegram] Invoice error:", error)
    return null
  }
}

// Send invoice directly to a chat
export async function sendInvoiceToChat(chatId: number, params: {
  title: string
  description: string
  payload: string
  prices: Array<{ label: string; amount: number }>
}): Promise<boolean> {
  if (!BOT_TOKEN) return false

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          title: params.title,
          description: params.description,
          payload: params.payload,
          provider_token: "", // Empty for Telegram Stars
          currency: "XTR",
          prices: params.prices,
          need_shipping_address: true,
          need_email: true,
        }),
      }
    )

    const data = await response.json()
    return data.ok
  } catch (error) {
    console.error("[Telegram] Send invoice error:", error)
    return false
  }
}

// GET endpoint for info
export async function GET() {
  return NextResponse.json({
    status: "Telegram Payment API Active",
    supported_currencies: ["XTR (Telegram Stars)"],
    box_prices_stars: BOX_PRICES_STARS,
    usage: {
      POST: "Create payment invoice",
      params: {
        productName: "Product name",
        stars: "Price in Stars (optional, calculated from boxType)",
        dropId: "Drop ID",
        quantity: "Number of boxes",
        boxType: "small | medium | large",
        customerTelegramId: "User's Telegram ID (for direct invoice)",
      },
    },
  })
}
