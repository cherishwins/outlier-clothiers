import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Telegram Payment webhook handler
// Handles pre_checkout_query and successful_payment events
// Docs: https://core.telegram.org/bots/payments

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const PAYMENT_PROVIDER_TOKEN = process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN

interface TelegramUpdate {
  update_id: number
  
  // Pre-checkout query (must answer within 10 seconds)
  pre_checkout_query?: {
    id: string
    from: {
      id: number
      first_name: string
      username?: string
    }
    currency: string
    total_amount: number
    invoice_payload: string
  }
  
  // Message with successful payment
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    successful_payment?: {
      currency: string
      total_amount: number
      invoice_payload: string
      telegram_payment_charge_id: string
      provider_payment_charge_id: string
    }
  }
}

interface InvoicePayload {
  dropId: number
  quantity: number
  customerTelegramId: number
  customerEmail?: string
  shippingAddress?: object
  boxType: "small" | "medium" | "large"
}

// Verify Telegram webhook signature
function verifyTelegramWebhook(
  request: NextRequest,
  rawBody: string
): boolean {
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secretToken) return true // Skip verification if not configured
  
  const telegramSignature = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
  return telegramSignature === secretToken
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    
    // Verify webhook authenticity
    if (!verifyTelegramWebhook(request, rawBody)) {
      console.error("[Telegram Webhook] Invalid signature")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const update: TelegramUpdate = JSON.parse(rawBody)
    console.log("[Telegram Webhook] Received update:", update.update_id)

    // Handle pre-checkout query (MUST respond within 10 seconds)
    if (update.pre_checkout_query) {
      return await handlePreCheckoutQuery(update.pre_checkout_query)
    }

    // Handle successful payment
    if (update.message?.successful_payment) {
      return await handleSuccessfulPayment(update.message)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}

async function handlePreCheckoutQuery(query: TelegramUpdate["pre_checkout_query"]) {
  if (!query || !BOT_TOKEN) {
    return NextResponse.json({ ok: true })
  }

  console.log("[Telegram Webhook] Pre-checkout query:", {
    id: query.id,
    from: query.from.username || query.from.id,
    amount: query.total_amount,
    currency: query.currency,
  })

  try {
    // Parse the invoice payload
    const payload: InvoicePayload = JSON.parse(query.invoice_payload)
    
    // Validate the order (check if drop is still active, slots available, etc.)
    const isValid = await validateOrder(payload)
    
    // Answer the pre-checkout query
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_checkout_query_id: query.id,
          ok: isValid,
          error_message: isValid ? undefined : "Order is no longer available",
        }),
      }
    )

    const result = await response.json()
    console.log("[Telegram Webhook] Pre-checkout answer:", result)
  } catch (error) {
    console.error("[Telegram Webhook] Pre-checkout error:", error)
    
    // Reject the payment if validation fails
    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_checkout_query_id: query.id,
          ok: false,
          error_message: "Payment validation failed. Please try again.",
        }),
      }
    )
  }

  return NextResponse.json({ ok: true })
}

async function handleSuccessfulPayment(message: NonNullable<TelegramUpdate["message"]>) {
  const payment = message.successful_payment
  if (!payment) return NextResponse.json({ ok: true })

  console.log("[Telegram Webhook] Successful payment:", {
    chargeId: payment.telegram_payment_charge_id,
    amount: payment.total_amount,
    currency: payment.currency,
    from: message.from.username || message.from.id,
  })

  try {
    // Parse invoice payload
    const payload: InvoicePayload = JSON.parse(payment.invoice_payload)
    
    // Import settlement service
    const { settleOrder } = await import("@/lib/settlement")

    // Convert Stars to USD (approximately 1 Star = $0.01)
    const amountUSD = payment.total_amount / 100

    // Settle the order
    const order = await settleOrder({
      dropId: payload.dropId,
      quantity: payload.quantity,
      customerWallet: `telegram:${message.from.id}`,
      customerEmail: payload.customerEmail,
      shippingAddress: payload.shippingAddress || {},
      paymentMethod: "telegram",
      paymentTxHash: payment.telegram_payment_charge_id,
      paymentAmount: amountUSD,
      telegramPaymentId: payment.telegram_payment_charge_id,
      telegramUserId: message.from.id,
    })

    console.log("[Telegram Webhook] Order settled:", order.id)

    // Send confirmation message to user
    if (BOT_TOKEN) {
      await sendPaymentConfirmation(
        message.chat.id,
        message.from.first_name,
        order.id,
        payload.boxType
      )
    }
  } catch (error) {
    console.error("[Telegram Webhook] Failed to settle order:", error)
    
    // Notify user of error
    if (BOT_TOKEN) {
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: message.chat.id,
            text: "⚠️ Payment received but there was an issue processing your order. Our team has been notified and will contact you shortly.",
            parse_mode: "HTML",
          }),
        }
      )
    }
  }

  return NextResponse.json({ ok: true })
}

async function validateOrder(payload: InvoicePayload): Promise<boolean> {
  // TODO: Add actual validation logic
  // 1. Check if drop exists and is still funding
  // 2. Check if slots are available
  // 3. Verify pricing matches
  
  // For now, always approve
  return true
}

async function sendPaymentConfirmation(
  chatId: number,
  firstName: string,
  orderId: string,
  boxType: string
) {
  const message = `
🎉 <b>Payment Confirmed!</b>

Thanks ${firstName}! Your order has been received.

<b>Order ID:</b> <code>${orderId}</code>
<b>Box Type:</b> ${boxType.toUpperCase()}

<b>What's Next:</b>
1. You'll receive an NFT receipt in your wallet
2. Once the drop is fully funded, we'll purchase the pallet
3. Your mystery box will ship within 7-10 days
4. We'll send you tracking info here

Questions? Reply to this message or email gm@outlierclothiers.com

<i>Thank you for being part of JUCHE GANG! 🔥</i>
`

  await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    }
  )
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "Telegram Payment Webhook Active",
    timestamp: new Date().toISOString(),
  })
}
