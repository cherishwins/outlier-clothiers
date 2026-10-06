"use client"

import { useState } from "react"
import { PaymentFlow } from "@/components/payment-flow"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function CheckoutPanel({ dropId }: { dropId: number }) {
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Card className="p-6 mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Boxes</label>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              -
            </Button>
            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
            <Button variant="outline" size="sm" onClick={() => setQuantity(Math.min(10, quantity + 1))}>
              +
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">What you are buying</h3>
          <p className="text-sm text-muted-foreground">
            A slot in drop #{dropId} on the FlashCargo escrow contract, one per box. If the drop is funded, we buy its
            load and pack boxes at random from its manifest: what is in a box, and what it is worth, varies. If it is
            cancelled or not released by its deadline, you can claim your deposit back from the contract with your
            receipt NFT.
          </p>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
        <PaymentFlow dropId={dropId} quantity={quantity} />
      </div>
    </div>
  )
}
