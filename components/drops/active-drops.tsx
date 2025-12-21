"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Package, Star, TrendingUp, Clock } from "lucide-react"
import { PaymentModal } from "@/components/payment/payment-modal"

const activeDrops = [
  {
    id: 1,
    name: "Hugo Boss Surplus Mystery Box",
    source: "ViaTrading - Manifested Pallet #HB-2847",
    boxPrice: 1200,
    tonPrice: 42,
    retailValue: "5,000-8,000",
    funded: 67,
    needed: 100,
    timeLeft: "4 days 12 hrs",
    items: ["Designer suits", "Dress shirts", "Leather accessories", "Premium ties"],
  },
  {
    id: 2,
    name: "Tech Accessories Grab Bag",
    source: "B-Stock - Amazon Returns Pallet",
    boxPrice: 450,
    tonPrice: 16,
    retailValue: "1,200-2,500",
    funded: 89,
    needed: 150,
    timeLeft: "2 days 8 hrs",
    items: ["Wireless headphones", "Phone cases", "Charging cables", "Smart watches"],
  },
  {
    id: 3,
    name: "Designer Streetwear Mystery",
    source: "Liquidation.com - Overstock",
    boxPrice: 890,
    tonPrice: 32,
    retailValue: "3,500-6,000",
    funded: 34,
    needed: 75,
    timeLeft: "6 days 5 hrs",
    items: ["Hoodies", "Sneakers", "Graphic tees", "Joggers"],
  },
]

export function ActiveDrops() {
  const [selectedDrop, setSelectedDrop] = useState<(typeof activeDrops)[0] | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  const handlePreOrder = (drop: (typeof activeDrops)[0]) => {
    setSelectedDrop(drop)
    setIsPaymentOpen(true)
  }

  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false)
    alert(`Success! Your mystery box for ${selectedDrop?.name} is secured.`)
  }

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20">
            <TrendingUp className="w-4 h-4 mr-1" />
            Funding Now
          </Badge>
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            Active <span className="text-primary">Mystery Drops</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Pre-order now. Once we hit the funding goal, we buy the pallet and ship your mystery box within 7-10 days.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {activeDrops.map((drop) => (
            <Card
              key={drop.id}
              className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {drop.timeLeft}
                  </Badge>
                  <Badge className="bg-primary/10 text-primary">
                    {drop.funded}/{drop.needed} sold
                  </Badge>
                </div>

                <h3 className="font-serif text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {drop.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">{drop.source}</p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Funding Progress</span>
                    <span className="font-bold text-primary">{drop.funded}%</span>
                  </div>
                  <Progress value={drop.funded} className="h-2" />
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Potential Value</div>
                  <div className="text-2xl font-bold text-primary mb-1">${drop.retailValue}</div>
                  <div className="text-xs text-muted-foreground">Based on manifest retail prices</div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">May Include</div>
                  <div className="flex flex-wrap gap-2">
                    {drop.items.map((item) => (
                      <Badge key={item} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-primary fill-primary" />
                    <span className="text-2xl font-bold text-primary">{drop.boxPrice}</span>
                  </div>
                  <span className="text-muted-foreground">or</span>
                  <span className="text-xl font-semibold">{drop.tonPrice} TON</span>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => handlePreOrder(drop)}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Pre-Order Mystery Box
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            If a drop doesn't reach funding goal, all pre-orders are automatically refunded. Zero risk.
          </p>
        </div>
      </div>

      {selectedDrop && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          product={{
            name: selectedDrop.name,
            price: selectedDrop.boxPrice,
            tonPrice: selectedDrop.tonPrice,
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </section>
  )
}
