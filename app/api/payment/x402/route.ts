import { type NextRequest, NextResponse } from "next/server"
import {
  ALREADY_USED,
  parsePayment,
  paymentRequiredResponse,
  paymentResponseHeaders,
  verifyAuthorization,
} from "x402-merchant"

import { attachOrder, claimX402, NotForSale, seenNonce, settleX402, x402Enabled, x402Quote, x402Token } from "@/lib/x402"

export const dynamic = "force-dynamic"

/**
 * x402 for a drop. Spec: https://github.com/coinbase/x402
 *
 *   GET  /api/payment/x402?dropId=1&quantity=2   -> 402: the price, v1 body + v2 PAYMENT-REQUIRED header
 *   POST /api/payment/x402?dropId=1&quantity=2   -> X-PAYMENT (or PAYMENT-SIGNATURE) header with the
 *        signed authorization; optional JSON body { customerEmail, shippingAddress }.
 *
 * Money is never read from the request. The amount comes from the contract's
 * slot price at the moment of the call and the recipient from the
 * environment; the signature has to match both or it is declined with the
 * reason. Verified, the nonce is claimed once, the CDP wallet collects the
 * USDC, and the order is settled into the escrow the same way the other
 * rails do.
 */

function params(req: NextRequest): { dropId: number; quantity: number } | NextResponse {
  const dropId = Number(req.nextUrl.searchParams.get("dropId"))
  const quantity = Number(req.nextUrl.searchParams.get("quantity") ?? "1")
  if (!Number.isInteger(dropId) || dropId <= 0) {
    return NextResponse.json({ error: "dropId is required" }, { status: 400 })
  }
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
    return NextResponse.json({ error: "quantity must be between 1 and 100" }, { status: 400 })
  }
  return { dropId, quantity }
}

function paymentRequired(quote: Awaited<ReturnType<typeof x402Quote>>, error?: string) {
  const r = paymentRequiredResponse(error ? { ...quote.price, error } : quote.price)
  return NextResponse.json(
    { ...r.body, drop: { id: quote.dropId, quantity: quote.quantity, totalUsd: quote.totalUsd } },
    { status: r.status, headers: r.headers }
  )
}

function quoteFailure(error: unknown) {
  if (error instanceof NotForSale) return NextResponse.json({ error: error.message }, { status: 409 })
  console.error("[x402] quote failed:", error)
  return NextResponse.json({ error: "Could not price this drop right now" }, { status: 503 })
}

function notEnabled() {
  return NextResponse.json({ error: "x402 payments are not enabled" }, { status: 503 })
}

export async function GET(req: NextRequest) {
  if (!x402Enabled()) return notEnabled()
  const p = params(req)
  if (p instanceof NextResponse) return p
  try {
    const quote = await x402Quote(p.dropId, p.quantity, req.nextUrl.toString())
    return paymentRequired(quote)
  } catch (error) {
    return quoteFailure(error)
  }
}

interface PostBody {
  customerEmail?: string
  shippingAddress?: object
}

export async function POST(req: NextRequest) {
  if (!x402Enabled()) return notEnabled()
  const p = params(req)
  if (p instanceof NextResponse) return p

  let quote
  try {
    quote = await x402Quote(p.dropId, p.quantity, req.nextUrl.toString())
  } catch (error) {
    return quoteFailure(error)
  }

  const parsed = parsePayment(req.headers)
  if (parsed.problem !== undefined) return paymentRequired(quote, parsed.problem)

  const token = x402Token()
  const result = await verifyAuthorization({
    authorization: parsed.payment.authorization,
    signature: parsed.payment.signature,
    payTo: quote.price.payTo,
    amountUnits: quote.amountUnits,
    token,
  })
  if (!result.verified) return paymentRequired(quote, result.reason)
  if (await seenNonce(result.nonce)) return paymentRequired(quote, ALREADY_USED)

  let body: PostBody = {}
  try {
    if ((req.headers.get("content-type") ?? "").includes("application/json")) body = await req.json()
  } catch {
    body = {}
  }

  const claimed = await claimX402(quote, {
    payer: result.payer,
    nonce: result.nonce,
    authorization: parsed.payment.authorization,
    signature: parsed.payment.signature,
  })
  if (claimed === "already_used") return paymentRequired(quote, ALREADY_USED)

  const receipt = (extra: Record<string, unknown>) =>
    paymentResponseHeaders({ success: true, payer: result.payer, network: token.caip2, ...extra })

  const settled = await settleX402(claimed)
  if (!settled.ok) {
    if (!settled.configured) {
      // Verified and recorded; nobody is configured to collect it yet.
      return NextResponse.json(
        { status: "authorized", paymentId: claimed.id, payer: result.payer, amountUnits: quote.amountUnits.toString() },
        { headers: receipt({}) }
      )
    }
    return NextResponse.json({ status: "failed", error: settled.error, paymentId: claimed.id }, { status: 502 })
  }

  // Money is in the shop's wallet. Now the order, and the escrow slot for the buyer.
  try {
    const { settleOrder } = await import("@/lib/settlement")
    const order = await settleOrder({
      dropId: quote.dropId,
      quantity: quote.quantity,
      customerWallet: result.payer,
      customerEmail: body.customerEmail,
      shippingAddress: body.shippingAddress ?? {},
      paymentMethod: "x402",
      paymentTxHash: settled.txHash,
      paymentAmount: quote.totalUsd,
    })
    await attachOrder(claimed.id, order.id)
    return NextResponse.json(
      {
        status: "settled",
        txHash: settled.txHash,
        orderId: order.id,
        orderStatus: order.status,
        receiptNftId: order.receipt_nft_id,
        payer: result.payer,
      },
      { headers: receipt({ transaction: settled.txHash }) }
    )
  } catch (error) {
    // The payment stands; the order record did not. Return the hash so it can be reconciled.
    console.error("[x402] order settlement failed after payment:", error)
    return NextResponse.json(
      { status: "settled", txHash: settled.txHash, orderError: "payment received; order record failed, we will reconcile" },
      { status: 200, headers: receipt({ transaction: settled.txHash }) }
    )
  }
}
