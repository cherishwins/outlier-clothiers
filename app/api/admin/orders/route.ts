import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { requireAdminToken } from "@/lib/auth"
import { ORDER_STATUS } from "@/lib/order-status"

export const dynamic = "force-dynamic"

const prisma = new PrismaClient()

// Orders and drops for the admin dashboard, straight from the database.
// Operator-only: `Authorization: Bearer <ADMIN_TOKEN>`, 503 while it is unset.
// It returns customer addresses, so nothing here is cached or public.
// Failures are logged, never echoed.

export async function GET(request: NextRequest) {
  const denied = requireAdminToken(request)
  if (denied) return denied

  try {
    const [recent, unescrowed, statusCounts, toShip, drops, soldByDrop, x402Unmatched] = await Promise.all([
      prisma.order.findMany({
        orderBy: { created_at: "desc" },
        take: 100,
        include: { drop: { select: { name: true } } },
      }),
      // Every one of these needs reconciling, so none are cut off by the page size.
      prisma.order.findMany({
        where: { status: ORDER_STATUS.PAID_UNESCROWED },
        orderBy: { created_at: "asc" },
        include: { drop: { select: { name: true } } },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.count({ where: { status: ORDER_STATUS.PAID, tracking_number: null } }),
      prisma.drop.findMany({ orderBy: { created_at: "desc" }, take: 50 }),
      prisma.order.groupBy({ by: ["drop_id"], _count: { _all: true } }),
      // Collected (or in flight) with no order attached: money in the shop's wallet, no order record.
      prisma.x402Payment.findMany({
        where: { OR: [{ status: "broadcast" }, { status: "settled", order_id: null }] },
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          payer: true,
          drop_id: true,
          quantity: true,
          amount_units: true,
          status: true,
          tx_hash: true,
          created_at: true,
        },
      }),
    ])

    const orderCountByDrop = new Map(soldByDrop.map((row) => [row.drop_id, row._count._all]))

    return NextResponse.json(
      {
        counts: {
          byStatus: Object.fromEntries(statusCounts.map((row) => [row.status, row._count._all])),
          toShip,
        },
        unescrowed: unescrowed.map(toOrderView),
        orders: recent.map(toOrderView),
        drops: drops.map((drop) => ({
          id: drop.id,
          name: drop.name,
          source: drop.source,
          status: drop.status,
          contractAddress: drop.contract_address,
          orders: orderCountByDrop.get(drop.id) ?? 0,
          createdAt: drop.created_at.toISOString(),
        })),
        x402Unmatched: x402Unmatched.map((p) => ({
          ...p,
          amount_units: p.amount_units.toString(),
          created_at: p.created_at.toISOString(),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("[Admin Orders] Query failed:", error)
    return NextResponse.json({ error: "Could not load orders" }, { status: 500 })
  }
}

type OrderWithDrop = Awaited<ReturnType<typeof prisma.order.findMany>>[number] & {
  drop: { name: string }
}

function toOrderView(order: OrderWithDrop) {
  return {
    id: order.id,
    dropName: order.drop.name,
    status: order.status,
    customerWallet: order.customer_wallet,
    customerEmail: order.customer_email,
    shippingAddress: order.shipping_address,
    paymentMethod: order.payment_method,
    paymentAmount: order.payment_amount,
    paymentCurrency: order.payment_currency,
    paymentTxHash: order.payment_tx_hash,
    receiptNftId: order.receipt_nft_id,
    receiptNftTx: order.receipt_nft_tx,
    trackingNumber: order.tracking_number,
    createdAt: order.created_at.toISOString(),
    paidAt: order.paid_at?.toISOString() ?? null,
  }
}
