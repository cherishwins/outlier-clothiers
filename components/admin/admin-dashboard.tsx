"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Truck, DollarSign, Users, Download, ExternalLink } from "lucide-react"
import { toast } from "@/hooks/use-toast"

// Mock data - replace with real database queries
const mockOrders = [
  {
    id: "ord_1",
    customer_wallet: "0x742d...f0bEb",
    drop_name: "Hugo Boss Mystery Box",
    status: "paid",
    payment_amount: 1200,
    shipping_address: "123 Main St, Toronto, ON M5H2N2",
    created_at: "2025-01-10T14:30:00Z",
  },
  {
    id: "ord_2",
    customer_wallet: "0x8b3c...a12De",
    drop_name: "Tech Accessories Grab Bag",
    status: "shipped",
    payment_amount: 450,
    tracking_number: "1Z999AA10123456789",
    shipping_address: "456 Elm St, New York, NY 10001",
    created_at: "2025-01-09T10:15:00Z",
    shipped_at: "2025-01-11T09:00:00Z",
  },
]

const mockDrops = [
  {
    id: "drop_1",
    name: "Hugo Boss Surplus Mystery Box",
    boxes_sold: 67,
    boxes_needed: 100,
    total_raised: 80400,
    pallet_cost: 45000,
    status: "funding",
    funding_deadline: "2025-01-15T23:59:59Z",
  },
  {
    id: "drop_2",
    name: "Tech Accessories Grab Bag",
    boxes_sold: 134,
    boxes_needed: 150,
    total_raised: 60300,
    pallet_cost: 8500,
    status: "funded",
    funding_deadline: "2025-01-12T23:59:59Z",
  },
]

export function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("orders")

  const handlePrintLabel = async (orderId: string) => {
    // Call /api/shipping/create-label
    toast({ title: "Label queued", description: `Printing label for ${orderId}` })
  }

  const handleBulkShip = async (dropId: string) => {
    // Call /api/admin/bulk-ship
    toast({ title: "Bulk ship queued", description: `Generating labels for all paid orders in ${dropId}` })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage drops, orders, and fulfillment</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Orders</span>
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">67</div>
          <div className="text-xs text-green-400 mt-1">+12 this week</div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Revenue</span>
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">$140,700</div>
          <div className="text-xs text-green-400 mt-1">+$15,200 this week</div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">To Ship</span>
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">23</div>
          <div className="text-xs text-yellow-400 mt-1">Awaiting fulfillment</div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Customers</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">156</div>
          <div className="text-xs text-green-400 mt-1">+8 this week</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="drops">Active Drops</TabsTrigger>
          <TabsTrigger value="pallets">Pallets</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card className="bg-card border-border">
            <div className="p-6 border-b border-border">
              <h3 className="font-serif text-2xl font-bold">Recent Orders</h3>
            </div>
            <div className="divide-y divide-border">
              {mockOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{order.id}</span>
                        <Badge
                          variant={order.status === "shipped" ? "default" : "secondary"}
                          className={order.status === "shipped" ? "bg-green-500/10 text-green-400" : ""}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{order.drop_name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_wallet}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{order.payment_amount} Stars</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm mb-4">
                    <div className="text-muted-foreground mb-1">Shipping Address:</div>
                    <div>{order.shipping_address}</div>
                    {order.tracking_number && (
                      <div className="mt-2 flex items-center gap-2 text-primary">
                        <Truck className="w-4 h-4" />
                        <span className="font-mono text-xs">{order.tracking_number}</span>
                        <a href="#" className="text-xs hover:underline flex items-center gap-1">
                          Track <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {order.status === "paid" && (
                    <Button
                      onClick={() => handlePrintLabel(order.id)}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Print Shipping Label
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Drops Tab */}
        <TabsContent value="drops">
          <div className="grid lg:grid-cols-2 gap-6">
            {mockDrops.map((drop) => (
              <Card key={drop.id} className="bg-card border-border">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-xl font-bold mb-1">{drop.name}</h3>
                      <Badge
                        variant={drop.status === "funded" ? "default" : "secondary"}
                        className={drop.status === "funded" ? "bg-green-500/10 text-green-400" : ""}
                      >
                        {drop.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Boxes Sold</div>
                      <div className="text-2xl font-bold">
                        {drop.boxes_sold}/{drop.boxes_needed}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Total Raised</div>
                      <div className="text-2xl font-bold text-primary">${drop.total_raised.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Funding Progress</span>
                      <span className="font-bold text-primary">
                        {Math.round((drop.total_raised / drop.pallet_cost) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.round((drop.total_raised / drop.pallet_cost) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {drop.status === "funded" && (
                    <Button onClick={() => handleBulkShip(drop.id)} className="w-full bg-primary hover:bg-primary/90">
                      <Truck className="w-4 h-4 mr-2" />
                      Generate All Shipping Labels
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pallets Tab */}
        <TabsContent value="pallets">
          <Card className="bg-card border-border">
            <div className="p-6">
              <h3 className="font-serif text-2xl font-bold mb-4">Pallet Management</h3>
              <p className="text-muted-foreground">Browse ViaTrading and add pallets to create new drops.</p>
              <Button className="mt-4 bg-transparent" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Browse ViaTrading Pallets
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
