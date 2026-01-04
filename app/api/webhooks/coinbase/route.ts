import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Coinbase Commerce webhook handler
// Docs: https://docs.cloud.coinbase.com/commerce/docs/webhooks

interface CoinbaseWebhookEvent {
  id: string
  type: string
  api_version: string
  created_at: string
  data: {
    id: string
    code: string
    name: string
    description: string
    hosted_url: string
    pricing: {
      local: { amount: string; currency: string }
      ethereum?: { amount: string; currency: string }
      usdc?: { amount: string; currency: string }
    }
    pricing_type: string
    payments: Array<{
      network: string
      transaction_id: string
      status: string
      value: { local: { amount: string; currency: string } }
      block: { height: number; hash: string }
    }>
    metadata: {
      drop_id?: string
      quantity?: string
      customer_wallet?: string
      customer_email?: string
      shipping_address?: string
    }
    timeline: Array<{
      time: string
      status: string
    }>
  }
}

// Verify Coinbase webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  const hmac = crypto.createHmac("sha256", webhookSecret)
  hmac.update(payload)
  const expectedSignature = hmac.digest("hex")
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("X-CC-Webhook-Signature")
    const webhookSecret = process.env.COINBASE_WEBHOOK_SECRET

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
      if (!isValid) {
        console.error("[Coinbase Webhook] Invalid signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const event: CoinbaseWebhookEvent = JSON.parse(rawBody)
    console.log("[Coinbase Webhook] Received event:", event.type, event.id)

    // Handle different event types
    switch (event.type) {
      case "charge:created":
        console.log("[Coinbase Webhook] Charge created:", event.data.code)
        break

      case "charge:pending":
        console.log("[Coinbase Webhook] Payment pending for charge:", event.data.code)
        break

      case "charge:confirmed":
        console.log("[Coinbase Webhook] Payment confirmed:", event.data.code)
        await handlePaymentConfirmed(event)
        break

      case "charge:failed":
        console.log("[Coinbase Webhook] Payment failed:", event.data.code)
        await handlePaymentFailed(event)
        break

      case "charge:resolved":
        console.log("[Coinbase Webhook] Charge resolved:", event.data.code)
        break

      default:
        console.log("[Coinbase Webhook] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Coinbase Webhook] Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

async function handlePaymentConfirmed(event: CoinbaseWebhookEvent) {
  const { data } = event
  const { metadata, payments } = data

  // Extract payment details
  const payment = payments?.[0]
  const txHash = payment?.transaction_id
  const network = payment?.network
  const amount = parseFloat(data.pricing.local.amount)

  console.log("[Coinbase Webhook] Processing confirmed payment:", {
    chargeId: data.id,
    txHash,
    network,
    amount,
    metadata,
  })

  // Import settlement service dynamically to avoid circular deps
  const { settleOrder } = await import("@/lib/settlement")

  try {
    // Parse shipping address from metadata
    let shippingAddress = {}
    if (metadata.shipping_address) {
      try {
        shippingAddress = JSON.parse(metadata.shipping_address)
      } catch {
        shippingAddress = { raw: metadata.shipping_address }
      }
    }

    // Settle the order
    const order = await settleOrder({
      dropId: metadata.drop_id ? parseInt(metadata.drop_id) : 0,
      quantity: metadata.quantity ? parseInt(metadata.quantity) : 1,
      customerWallet: metadata.customer_wallet || `coinbase:${data.id}`,
      customerEmail: metadata.customer_email,
      shippingAddress,
      paymentMethod: "coinbase",
      paymentTxHash: txHash,
      paymentAmount: amount,
      coinbaseChargeId: data.id,
    })

    console.log("[Coinbase Webhook] Order settled:", order.id)
  } catch (error) {
    console.error("[Coinbase Webhook] Failed to settle order:", error)
    throw error
  }
}

async function handlePaymentFailed(event: CoinbaseWebhookEvent) {
  const { data } = event
  console.log("[Coinbase Webhook] Payment failed for charge:", data.id)
  
  // Log failure for monitoring
  // In production, you might want to:
  // 1. Update any pending order status
  // 2. Send notification to customer
  // 3. Log to error tracking service
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "Coinbase Commerce Webhook Active",
    timestamp: new Date().toISOString(),
  })
}
