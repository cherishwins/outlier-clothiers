"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ExternalLink, Star, Package, Clock } from "lucide-react"
import { PaymentModal } from "@/components/payment/payment-modal"
import { toast } from "@/hooks/use-toast"

const fundingPallets = [
  {
    id: 1,
    name: "Hugo Boss Full Truckload - 10,000 Units",
    source: "ViaTrading",
    sourceUrl: "https://www.viatrading.com",
    palletCost: 45000,
    boxesNeeded: 100,
    boxPrice: 1200,
    funded: 67,
    raised: 80400,
    timeLeft: "4 days 12 hrs",
    manifest: ["2,400 suits (retail $300-800)", "3,200 dress shirts", "1,800 ties", "2,600 accessories"],
  },
  {
    id: 2,
    name: "Amazon Returns Tech Pallet",
    source: "B-Stock",
    sourceUrl: "https://bstock.com",
    palletCost: 8500,
    boxesNeeded: 150,
    boxPrice: 450,
    funded: 89,
    raised: 60075,
    timeLeft: "2 days 8 hrs",
    manifest: ["Wireless headphones", "Phone accessories", "Smart watches", "Charging cables"],
  },
]

export function FundingPallets() {
  const [selectedPallet, setSelectedPallet] = useState<(typeof fundingPallets)[0] | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  const handleBackPallet = (pallet: (typeof fundingPallets)[0]) => {
    setSelectedPallet(pallet)
    setIsPaymentOpen(true)
  }

  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false)
    toast({
      title: "Backed",
      description: selectedPallet?.name ? `You backed ${selectedPallet.name}.` : "Backing confirmed.",
    })
  }

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            Pallets <span className="text-primary">Funding Now</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            These are the real liquidation pallets we're trying to buy. Back them now. Once funded, we execute.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {fundingPallets.map((pallet) => (
            <Card
              key={pallet.id}
              className="bg-card border-border overflow-hidden hover:border-primary/50 transition-all duration-300"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {pallet.timeLeft}
                  </Badge>
                  <a
                    href={pallet.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {pallet.source} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <h3 className="font-serif text-3xl font-bold mb-2">{pallet.name}</h3>

                <div className="bg-secondary/50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Pallet Cost</div>
                      <div className="text-2xl font-bold text-primary">${pallet.palletCost.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Boxes Needed</div>
                      <div className="text-2xl font-bold">{pallet.boxesNeeded}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Funding Progress</span>
                      <span className="font-bold text-primary">
                        {pallet.funded}% (${pallet.raised.toLocaleString()})
                      </span>
                    </div>
                    <Progress value={pallet.funded} className="h-3" />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Manifest Preview</div>
                  <div className="space-y-2">
                    {pallet.manifest.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Package className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-primary fill-primary" />
                    <span className="text-2xl font-bold text-primary">{pallet.boxPrice}</span>
                  </div>
                  <span className="text-muted-foreground">per mystery box</span>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
                  onClick={() => handleBackPallet(pallet)}
                >
                  Back This Pallet
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-4">
            We show you the exact pallet, source, and manifest. Full transparency. If it doesn't fund, everyone gets
            refunded.
          </p>
          <Button
            variant="outline"
            className="border-primary/30 hover:border-primary hover:bg-primary/10 bg-transparent"
          >
            Browse Past Successful Pallets
          </Button>
        </div>
      </div>

      {selectedPallet && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          product={{
            name: selectedPallet.name,
            price: selectedPallet.boxPrice,
            tonPrice: selectedPallet.boxPrice / 28, // rough conversion
            dropId: selectedPallet.id,
            quantity: 1,
            boxType: "medium",
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </section>
  )
}
