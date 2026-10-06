import { type NextRequest, NextResponse } from "next/server"
import { parseDropId } from "@/lib/drop-id"
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

    // Drops are numbered from 0 on the contract; an absent dropId is not drop 0.
    const resolvedDropId = parseDropId(dropId)
    const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"

    if (resolvedDropId === null) {
      return NextResponse.json(
        { success: false, error: "dropId must be a non-negative integer" },
        { status: 400 }
      )
    }

    // Total Stars from the contract's slot price. There is no fallback price:
    // the webhook re-quotes and refuses any invoice that does not match.
    let totalStars: number
    try {
      const quote = await quoteDrop({ dropId: resolvedDropId, quantity, isTestnet })
      totalStars = quote.totalStars
      if (quote.totalUsdc <= BigInt(0)) {
        // No price on the contract: the drop does not exist there (yet).
        return NextResponse.json(
          { success: false, error: `drop #${resolvedDropId} is not on sale` },
          { status: 409 }
        )
      }
    } catch (error) {
      console.error("[Telegram] Could not price drop:", error)
      return NextResponse.json(
        { success: false, error: "Could not price this drop right now" },
        { status: 503 }
      )
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
    const paymentUrl = `https://t.me/${botUsername}?start=pay_${boxType}_${quantity}_${resolvedDropId}`

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
    pricing: "Stars are quoted from the drop's slot price on the FlashCargo contract",
    usage: {
      POST: "Create payment invoice",
      params: {
        productName: "Product name",
        stars: "Ignored; the price is quoted from the contract",
        dropId: "Drop ID",
        quantity: "Number of boxes",
        boxType: "small | medium | large",
        customerTelegramId: "User's Telegram ID (for direct invoice)",
      },
    },
  })
}
