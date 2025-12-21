"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Zap, Star } from "lucide-react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    name: string
    price: number // in Stars
    tonPrice: number
    usdPrice?: number
  }
  onPaymentSuccess?: () => void
}

type PaymentMethod = "coinbase" | "x402" | "telegram" | null

export function PaymentModal({ isOpen, onClose, product, onPaymentSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate USD price (approximate: 1 Star ≈ $0.01 USD)
  const usdPrice = product.usdPrice || (product.price * 0.01).toFixed(2)

  const handlePayment = async (method: PaymentMethod) => {
    setIsProcessing(true)

    try {
      if (method === "coinbase") {
        // Coinbase Commerce integration
        const response = await fetch("/api/payment/coinbase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: product.name,
            amount: usdPrice,
          }),
        })
        const data = await response.json()
        // Redirect to Coinbase hosted checkout
        window.location.href = data.hosted_url
      } else if (method === "x402") {
        // x402 HTTP 402 flow
        const response = await fetch("/api/payment/x402", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: product.name,
            amount: usdPrice,
          }),
        })

        if (response.status === 402) {
          // Payment required - get payment details
          const paymentInfo = await response.json()
          // Show payment instructions or redirect to wallet
          alert(`Pay ${paymentInfo.amount} USDC to ${paymentInfo.address}`)
        }
      } else if (method === "telegram") {
        // Telegram Stars/TON payment via Telegram WebApp API
        // @ts-ignore - Telegram WebApp API
        if (window.Telegram?.WebApp) {
          // @ts-ignore
          window.Telegram.WebApp.openInvoice(
            `stars://${product.price}?product=${encodeURIComponent(product.name)}`,
            (status: string) => {
              if (status === "paid") {
                onPaymentSuccess?.()
              }
            },
          )
        } else {
          // Fallback for non-Telegram environments
          alert("Open this in Telegram to pay with Stars/TON")
        }
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Choose Payment Method</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {product.name} • ${usdPrice} USD
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Coinbase Commerce - Easiest */}
          <button
            onClick={() => handlePayment("coinbase")}
            disabled={isProcessing}
            className="w-full p-4 bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-all hover:border-primary/50 text-left group disabled:opacity-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Credit/Debit Card</span>
                    <Badge className="bg-green-500/10 text-green-400 text-xs">Easiest</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Pay with any card via Coinbase Commerce</p>
                  <p className="text-sm font-bold text-foreground mt-1">${usdPrice} USD</p>
                </div>
              </div>
            </div>
          </button>

          {/* x402 - Instant */}
          <button
            onClick={() => handlePayment("x402")}
            disabled={isProcessing}
            className="w-full p-4 bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-all hover:border-primary/50 text-left group disabled:opacity-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Crypto (x402)</span>
                    <Badge className="bg-purple-500/10 text-purple-400 text-xs">Instant</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">USDC, USDT, or stablecoins</p>
                  <p className="text-sm font-bold text-foreground mt-1">${usdPrice} USD</p>
                </div>
              </div>
            </div>
          </button>

          {/* Telegram Stars/TON */}
          <button
            onClick={() => handlePayment("telegram")}
            disabled={isProcessing}
            className="w-full p-4 bg-secondary hover:bg-secondary/80 border border-primary/30 rounded-lg transition-all hover:border-primary text-left group disabled:opacity-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-primary fill-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Telegram Stars/TON</span>
                    <Badge className="bg-primary/10 text-primary text-xs">Native</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Pay directly in Telegram</p>
                  <p className="text-sm font-bold text-primary mt-1">
                    {product.price} Stars or {product.tonPrice} TON
                  </p>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="text-center pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Secure checkout powered by Coinbase Commerce, x402, and Telegram
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
