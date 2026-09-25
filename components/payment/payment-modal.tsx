"use client"

import { useState } from "react"
import { useAccount, useConnect, useSignTypedData, useSwitchChain } from "wagmi"
import { buildTypedData, freshNonce, parseOffer, paymentHeader, typedDataForViem } from "x402-merchant/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Zap, Star } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatUSDC } from "@/lib/contracts"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    name: string
    price: number // in Stars
    tonPrice: number
    usdPrice?: number
    dropId?: number
    quantity?: number
    boxType?: "small" | "medium" | "large"
  }
  onPaymentSuccess?: () => void
}

type PaymentMethod = "coinbase" | "x402" | "telegram" | null

export function PaymentModal({ isOpen, onClose, product, onPaymentSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { address, chainId } = useAccount()
  const { connectAsync, connectors } = useConnect()
  const { switchChainAsync } = useSwitchChain()
  const { signTypedDataAsync } = useSignTypedData()

  const quantity = product.quantity ?? 1
  const boxType = product.boxType ?? "medium"
  const dropId = product.dropId ?? 0

  // Calculate USD price (approximate: 1 Star ≈ $0.01 USD)
  const usdPriceNumber = typeof product.usdPrice === "number" ? product.usdPrice : product.price * 0.01
  const usdPriceDisplay = usdPriceNumber.toFixed(2)

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
            amount: usdPriceNumber,
            dropId,
            quantity,
            boxType,
          }),
        })
        const data = await response.json()
        // Redirect to Coinbase hosted checkout
        window.location.href = data.hosted_url
      } else if (method === "x402") {
        // x402: one signature from the buyer's wallet, no gas, no transaction.
        // The server quotes the slot price as a 402, the wallet signs an
        // EIP-3009 authorization for exactly that amount to the shop's
        // address, and the shop collects it and funds the escrow slot.
        const endpoint = `/api/payment/x402?dropId=${dropId}&quantity=${quantity}`
        const quoteRes = await fetch(endpoint, { cache: "no-store" })
        const quoteBody = await quoteRes.json().catch(() => ({}))
        if (quoteRes.status !== 402) {
          throw new Error(quoteBody?.error || `Payment is unavailable (${quoteRes.status})`)
        }
        const offer = parseOffer(quoteBody)

        let from = address
        if (!from) {
          const injected = connectors.find((c) => c.id === "injected")
          const hasInjected = typeof window !== "undefined" && Boolean((window as { ethereum?: unknown }).ethereum)
          const connector = (hasInjected && injected) || connectors[connectors.length - 1]
          const connected = await connectAsync({ connector })
          from = connected.accounts[0]
        }
        if (!from) throw new Error("No wallet account was shared.")
        if (offer.chainId !== 8453 && offer.chainId !== 84532) throw new Error("Unsupported network in the offer.")
        if (chainId !== offer.chainId) await switchChainAsync({ chainId: offer.chainId })

        const td = buildTypedData(offer, { from, nonce: freshNonce() })
        const signature = await signTypedDataAsync(typedDataForViem(td))

        const payRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...paymentHeader(td, signature) },
          body: JSON.stringify({}),
        })
        const paid = await payRes.json().catch(() => ({}))
        if (payRes.status === 402) throw new Error(paid?.error || "The payment was declined.")
        if (!payRes.ok) throw new Error(paid?.error || "The payment could not be completed.")

        toast({
          title: paid.status === "settled" ? "Paid" : "Payment authorized",
          description:
            paid.status === "settled"
              ? `${formatUSDC(BigInt(offer.amount))} USDC received${paid.receiptNftId ? `, receipt #${paid.receiptNftId}` : ""}.`
              : `${formatUSDC(BigInt(offer.amount))} USDC authorized. We collect it and reserve your slot.`,
        })
        onPaymentSuccess?.()
        onClose()
      } else if (method === "telegram") {
        // Telegram Stars/TON payment via Telegram WebApp API
        const tg = (window as unknown as { Telegram?: { WebApp?: any } })?.Telegram?.WebApp
        const telegramUserId = tg?.initDataUnsafe?.user?.id as number | undefined

        const response = await fetch("/api/payment/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: product.name,
            stars: product.price,
            dropId,
            quantity,
            boxType,
            customerTelegramId: telegramUserId,
          }),
        })

        if (!response.ok) {
          const err = await response.text()
          throw new Error(err || "Telegram payment request failed")
        }

        const data = (await response.json()) as
          | { payment_type: "stars"; invoice_url: string }
          | { payment_type: "deeplink"; payment_url: string; instructions?: string }

        if (tg?.openInvoice && data.payment_type === "stars") {
          tg.openInvoice(data.invoice_url, (status: string) => {
            if (status === "paid") {
              toast({ title: "Payment confirmed", description: "Telegram Stars payment completed." })
              onPaymentSuccess?.()
            } else if (status === "cancelled") {
              toast({ title: "Payment cancelled", description: "You cancelled the Telegram payment." })
            } else if (status === "failed") {
              toast({ title: "Payment failed", description: "Telegram payment failed. Try again." })
            }
          })
        } else if (data.payment_type === "deeplink") {
          window.open(data.payment_url, "_blank", "noopener,noreferrer")
          toast({
            title: "Open Telegram to pay",
            description: data.instructions || "Complete payment in Telegram (Stars).",
          })
        } else if (data.payment_type === "stars") {
          // Fallback if openInvoice isn't available
          window.open(data.invoice_url, "_blank", "noopener,noreferrer")
          toast({ title: "Open invoice", description: "Complete the Stars payment in Telegram." })
        }
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again.",
      })
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
            {product.name} • ${usdPriceDisplay} USD
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
                  <p className="text-sm font-bold text-foreground mt-1">${usdPriceDisplay} USD</p>
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
                  <p className="text-sm font-bold text-foreground mt-1">${usdPriceDisplay} USD</p>
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
