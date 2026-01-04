"use client"

import { useState } from "react"
import { PaymentFlow } from "@/components/payment-flow"
import { WalletButton } from "@/components/wallet-connect"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const boxOptions = [
  {
    type: "small" as const,
    name: "Starter Box",
    price: 15,
    items: 5,
    description: "Perfect for trying us out",
  },
  {
    type: "medium" as const,
    name: "Value Box",
    price: 35,
    items: 15,
    description: "Best value per item",
    popular: true,
  },
  {
    type: "large" as const,
    name: "Treasure Box",
    price: 70,
    items: 35,
    description: "Maximum mystery, maximum savings",
  },
]

export default function CheckoutPage() {
  const [selectedBox, setSelectedBox] = useState<"small" | "medium" | "large" | null>(null)
  const [quantity, setQuantity] = useState(1)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="Logo" width={40} height={40} />
            <span className="font-bold text-primary">OUTLIER CLOTHIERS</span>
          </Link>
          <WalletButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/drops" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Drops
        </Link>

        <h1 className="text-4xl font-bold mb-2">
          <span className="text-primary">Mystery Box</span> Checkout
        </h1>
        <p className="text-muted-foreground mb-8">
          Drop #1: Luxury Mix - 154K items from top brands
        </p>

        {!selectedBox ? (
          <>
            <h2 className="text-xl font-semibold mb-6">Select Your Box Size</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {boxOptions.map((box) => (
                <Card
                  key={box.type}
                  className={`relative p-6 cursor-pointer transition-all hover:border-primary ${
                    selectedBox === box.type ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => setSelectedBox(box.type)}
                >
                  {box.popular && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  <Package className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-1">{box.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{box.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">${box.price}</span>
                    <span className="text-muted-foreground">USDC</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {box.items} mystery items
                  </p>
                  <Button
                    className="w-full mt-4 bg-primary hover:bg-primary/90"
                    onClick={() => setSelectedBox(box.type)}
                  >
                    Select
                  </Button>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Box Selection Summary */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Selection</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedBox(null)}>
                  Change
                </Button>
              </div>

              <Card className="p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold capitalize">{selectedBox} Box</h3>
                    <p className="text-sm text-muted-foreground">
                      {boxOptions.find((b) => b.type === selectedBox)?.items} mystery items
                    </p>
                    <p className="text-xl font-bold text-primary mt-2">
                      ${boxOptions.find((b) => b.type === selectedBox)?.price} USDC
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <label className="text-sm text-muted-foreground mb-2 block">Quantity</label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </Card>

              {/* What's Inside */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">What Could Be Inside</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>- Essie, Maybelline, L'Oreal cosmetics</li>
                  <li>- BOZZOLO, ZENANA, KAVIO apparel</li>
                  <li>- Designer sunglasses</li>
                  <li>- Premium shoes</li>
                  <li>- Skincare products</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">
                  * Items are randomly selected from manifested inventory
                </p>
              </Card>
            </div>

            {/* Payment Flow */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
              <PaymentFlow dropId={0} boxType={selectedBox} quantity={quantity} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
