"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Package, Star, Clock, ExternalLink } from "lucide-react"
import { PaymentModal } from "@/components/payment/payment-modal"
import type { OpenDrop } from "@/lib/pricing"

// Every number on these cards is read from the FlashCargo contract by the
// page (lib/pricing.ts listOpenDrops). No drops on the contract, no cards.

/** UTC date, so the server and the browser render the same text. */
function formatDeadline(unixSeconds: number): string {
  return `${new Date(unixSeconds * 1000).toISOString().slice(0, 10)} UTC`
}

function ManifestLink({ uri }: { uri: string }) {
  if (!/^https?:\/\//i.test(uri)) {
    return <span className="break-all">{uri || "not published"}</span>
  }
  return (
    <a href={uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
      View manifest <ExternalLink className="w-3 h-3" />
    </a>
  )
}

export function DropCard({ drop, onPreOrder }: { drop: OpenDrop; onPreOrder: (drop: OpenDrop) => void }) {
  const soldOut = drop.slotsSold >= drop.totalSlots

  return (
    <Card className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Ends {formatDeadline(drop.deadline)}
          </Badge>
          <Badge className="bg-primary/10 text-primary">
            {drop.slotsSold}/{drop.totalSlots} boxes
          </Badge>
        </div>

        <h3 className="font-serif text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
          Drop #{drop.dropId}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Manifest: <ManifestLink uri={drop.manifestUri} />
        </p>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Funding</span>
            <span className="font-bold text-primary">
              ${drop.raisedUsd} of ${drop.targetUsd}
            </span>
          </div>
          <Progress value={drop.progressPercent} className="h-2" />
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Boxes are packed at random from the load&apos;s manifest. What is in a box, and what it is worth, varies.
        </p>

        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-2xl font-bold text-primary">${drop.slotPriceUsd}</span>
          <span className="text-muted-foreground">USDC per box</span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            (<Star className="w-3 h-3 text-primary fill-primary" />
            {drop.slotPriceStars} Stars)
          </span>
        </div>

        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => onPreOrder(drop)}
          disabled={soldOut}
        >
          <Package className="w-4 h-4 mr-2" />
          {soldOut ? "Sold out" : "Pre-Order Mystery Box"}
        </Button>
        {!soldOut && (
          <Link
            href={`/checkout?dropId=${drop.dropId}`}
            className="block text-center text-xs text-muted-foreground hover:text-primary mt-3"
          >
            Or pay from your own wallet (USDC on Base)
          </Link>
        )}
      </div>
    </Card>
  )
}

/** The cards plus the payment modal they open. */
export function DropGrid({ drops }: { drops: OpenDrop[] }) {
  const [selectedDrop, setSelectedDrop] = useState<OpenDrop | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  const handlePreOrder = (drop: OpenDrop) => {
    setSelectedDrop(drop)
    setIsPaymentOpen(true)
  }

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {drops.map((drop) => (
          <DropCard key={drop.dropId} drop={drop} onPreOrder={handlePreOrder} />
        ))}
      </div>

      {selectedDrop && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          product={{
            name: `Drop #${selectedDrop.dropId} mystery box`,
            price: selectedDrop.slotPriceStars,
            usdPrice: Number(selectedDrop.slotPriceUsd),
            dropId: selectedDrop.dropId,
            quantity: 1,
          }}
          onPaymentSuccess={() => setIsPaymentOpen(false)}
        />
      )}
    </>
  )
}

/** What to show when there is nothing to list: the chain could not be read, or no drop is open. */
export function NoDrops({ unavailable }: { unavailable: boolean }) {
  return (
    <Card className="bg-card/50 border-border p-10 max-w-2xl mx-auto text-center">
      <Package className="w-10 h-10 text-primary mx-auto mb-4" />
      <h3 className="font-serif text-2xl font-bold mb-2">
        {unavailable ? "Drops could not be loaded right now" : "No drops are live yet"}
      </h3>
      <p className="text-muted-foreground mb-6">
        {unavailable
          ? "We read drops straight from the escrow contract, and it did not answer. Try again in a minute."
          : "When a drop opens, it will appear here with its manifest, price and funding progress."}
      </p>
      <a href="https://t.me/OutlierClothiersBot" target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="border-primary/30 hover:border-primary hover:bg-primary/10 bg-transparent">
          Get notified on Telegram
        </Button>
      </a>
    </Card>
  )
}

export function ActiveDrops({ drops }: { drops: OpenDrop[] | null }) {
  return (
    <section id="active-drops" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            Active <span className="text-primary">Mystery Drops</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Pre-order a box. If the drop reaches its target before its deadline, we buy the load and ship.
          </p>
        </div>

        {drops && drops.length > 0 ? <DropGrid drops={drops} /> : <NoDrops unavailable={drops === null} />}

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Each box is bought as a slot in the FlashCargo escrow contract. If the drop is cancelled, or is not
            released by its deadline, its deposits are refundable from the contract.
          </p>
        </div>
      </div>
    </section>
  )
}
