"use client"

import { useState, type FormEvent } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Package, Truck, Boxes, Lock } from "lucide-react"
import { ORDER_STATUS } from "@/lib/order-status"
import { cn } from "@/lib/utils"

// Everything shown here comes from GET /api/admin/orders (the database),
// which needs the operator's ADMIN_TOKEN. The token is kept in memory only.

interface OrderView {
  id: string
  dropName: string
  status: string
  customerWallet: string
  customerEmail: string | null
  shippingAddress: unknown
  paymentMethod: string
  paymentAmount: number
  paymentCurrency: string
  paymentTxHash: string | null
  receiptNftId: string | null
  receiptNftTx: string | null
  trackingNumber: string | null
  createdAt: string
  paidAt: string | null
}

interface DropView {
  id: string
  name: string
  source: string
  status: string
  contractAddress: string | null
  orders: number
  createdAt: string
}

interface X402View {
  id: string
  payer: string
  drop_id: number
  quantity: number
  amount_units: string
  status: string
  tx_hash: string | null
  created_at: string
}

interface AdminData {
  counts: { byStatus: Record<string, number>; toShip: number }
  unescrowed: OrderView[]
  orders: OrderView[]
  drops: DropView[]
  x402Unmatched: X402View[]
}

function formatAddress(address: unknown): string {
  if (!address || typeof address !== "object") return "—"
  const a = address as Record<string, unknown>
  if (typeof a.raw === "string") return a.raw
  const parts = [a.name, a.street1, a.street2, a.city, a.state, a.zip, a.country].filter(
    (p): p is string => typeof p === "string" && p.length > 0
  )
  return parts.length > 0 ? parts.join(", ") : "—"
}

/** USDC base units (6 decimals) as dollars, without floating point. */
function formatUnits(units: string): string {
  const padded = units.padStart(7, "0")
  return `${padded.slice(0, -6)}.${padded.slice(-6, -4)}`
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        status === ORDER_STATUS.PAID_UNESCROWED && "bg-destructive/15 text-destructive",
        status === ORDER_STATUS.PAID && "bg-primary/10 text-primary",
        (status === "shipped" || status === "delivered") && "bg-green-500/10 text-green-400"
      )}
    >
      {status === ORDER_STATUS.PAID_UNESCROWED ? "paid, not escrowed" : status}
    </Badge>
  )
}

function OrderRow({ order }: { order: OrderView }) {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm">{order.id}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">{order.dropName}</p>
          <p className="text-xs text-muted-foreground break-all">{order.customerWallet}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-primary">
            {order.paymentAmount} {order.paymentCurrency}
          </div>
          <div className="text-xs text-muted-foreground">
            {order.paymentMethod} · {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
      <div className="grid gap-1 text-xs text-muted-foreground">
        <div>Ship to: {formatAddress(order.shippingAddress)}</div>
        {order.paymentTxHash && <div className="break-all">Payment: {order.paymentTxHash}</div>}
        {order.receiptNftTx && (
          <div className="break-all">
            buySlot: {order.receiptNftTx}
            {order.receiptNftId ? ` (receipt #${order.receiptNftId})` : ""}
          </div>
        )}
        {order.trackingNumber && (
          <div className="flex items-center gap-1 text-primary">
            <Truck className="w-3 h-3" />
            <span className="font-mono">{order.trackingNumber}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const [token, setToken] = useState("")
  const [data, setData] = useState<AdminData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (res.status === 401) throw new Error("That token was not accepted.")
      if (res.status === 503) throw new Error("The admin API is off: ADMIN_TOKEN is not set on the server.")
      if (!res.ok) throw new Error("Could not load orders. Check the server logs.")
      setData((await res.json()) as AdminData)
    } catch (e) {
      setData(null)
      setError(e instanceof Error ? e.message : "Could not load orders.")
    } finally {
      setLoading(false)
    }
  }

  const totalOrders = data ? Object.values(data.counts.byStatus).reduce((sum, n) => sum + n, 0) : 0
  const unescrowedCount = data?.counts.byStatus[ORDER_STATUS.PAID_UNESCROWED] ?? 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Orders and drops from the database.</p>
      </div>

      <form onSubmit={load} className="flex flex-col sm:flex-row gap-3 mb-8 max-w-xl">
        <Input
          type="password"
          autoComplete="off"
          placeholder="ADMIN_TOKEN"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          aria-label="Admin token"
        />
        <Button type="submit" disabled={loading || !token} className="bg-primary hover:bg-primary/90">
          <Lock className="w-4 h-4 mr-2" />
          {loading ? "Loading…" : data ? "Refresh" : "Load"}
        </Button>
      </form>

      {error && <p className="mb-8 text-sm text-destructive">{error}</p>}

      {!data ? (
        <Card className="p-6 bg-card border-border text-muted-foreground">
          Enter the admin token to load orders. Nothing is shown without it.
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Orders</span>
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">{totalOrders}</div>
            </Card>
            <Card className={cn("p-6 bg-card border-border", unescrowedCount > 0 && "border-destructive")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Paid, not escrowed</span>
                <AlertTriangle className={cn("w-5 h-5", unescrowedCount > 0 ? "text-destructive" : "text-primary")} />
              </div>
              <div className={cn("text-3xl font-bold", unescrowedCount > 0 && "text-destructive")}>
                {unescrowedCount}
              </div>
            </Card>
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Paid, no tracking yet</span>
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">{data.counts.toShip}</div>
            </Card>
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Drops in database</span>
                <Boxes className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">{data.drops.length}</div>
            </Card>
          </div>

          {(data.unescrowed.length > 0 || data.x402Unmatched.length > 0) && (
            <Card className="mb-8 bg-card border-destructive">
              <div className="p-6 border-b border-border">
                <h3 className="font-serif text-2xl font-bold text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Needs reconciliation
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Money was received but did not reach escrow, or reached the shop&apos;s wallet without an order.
                  Check each on chain, then buy the slot or refund the buyer.
                </p>
              </div>
              <div className="divide-y divide-border">
                {data.unescrowed.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
                {data.x402Unmatched.map((p) => (
                  <div key={p.id} className="p-6 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono">x402 {p.id}</span>
                      <Badge variant="secondary">{p.status === "broadcast" ? "broadcast, unconfirmed" : "settled, no order"}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground grid gap-1">
                      <div className="break-all">Payer: {p.payer}</div>
                      <div>
                        Drop #{p.drop_id} × {p.quantity} · {formatUnits(p.amount_units)} USDC ·{" "}
                        {new Date(p.created_at).toLocaleString()}
                      </div>
                      {p.tx_hash && <div className="break-all">Tx: {p.tx_hash}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Tabs defaultValue="orders">
            <TabsList className="mb-6">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="drops">Drops</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card className="bg-card border-border">
                <div className="p-6 border-b border-border">
                  <h3 className="font-serif text-2xl font-bold">Recent orders</h3>
                  <p className="text-xs text-muted-foreground mt-1">Newest 100.</p>
                </div>
                {data.orders.length === 0 ? (
                  <p className="p-6 text-muted-foreground">No orders yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.orders.map((order) => (
                      <OrderRow key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="drops">
              <Card className="bg-card border-border">
                <div className="p-6 border-b border-border">
                  <h3 className="font-serif text-2xl font-bold">Drops in the database</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Targets, deadlines and amounts raised live on the FlashCargo contract, not here.
                  </p>
                </div>
                {data.drops.length === 0 ? (
                  <p className="p-6 text-muted-foreground">No drops in the database yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.drops.map((drop) => (
                      <div key={drop.id} className="p-6 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{drop.name}</span>
                            <Badge variant="secondary">{drop.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{drop.source}</p>
                          {drop.contractAddress && (
                            <p className="text-xs text-muted-foreground break-all">{drop.contractAddress}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-bold">{drop.orders}</div>
                          <div className="text-xs text-muted-foreground">orders</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
