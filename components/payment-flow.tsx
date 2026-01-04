"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { WalletConnect } from "./wallet-connect"
import {
  FLASH_CARGO_ABI,
  ERC20_ABI,
  CONTRACTS,
  formatUSDC,
  parseUSDC,
  DropStatus,
} from "@/lib/contracts"
import {
  Package,
  Check,
  Loader2,
  AlertCircle,
  Wallet,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react"

interface PaymentFlowProps {
  dropId: number
  boxType: "small" | "medium" | "large"
  quantity?: number
}

const BOX_PRICES = {
  small: 15,
  medium: 35,
  large: 70,
}

const BOX_ITEMS = {
  small: 5,
  medium: 15,
  large: 35,
}

type Step = "connect" | "approve" | "pay" | "confirming" | "success" | "error"

export function PaymentFlow({ dropId, boxType, quantity = 1 }: PaymentFlowProps) {
  const { address, isConnected } = useAccount()
  const [step, setStep] = useState<Step>("connect")
  const [error, setError] = useState<string | null>(null)

  const isTestnet = true // Toggle for mainnet
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base

  const basePrice = BOX_PRICES[boxType]
  const totalPrice = basePrice * quantity
  const totalItems = BOX_ITEMS[boxType] * quantity
  const priceInUSDC = parseUSDC(totalPrice)

  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.usdc,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, contracts.flashCargo] : undefined,
  })

  // Check USDC balance
  const { data: balance } = useReadContract({
    address: contracts.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  })

  // Approve USDC
  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApproving,
    error: approveError,
  } = useWriteContract()

  // Buy slot
  const {
    writeContract: buySlot,
    data: buyHash,
    isPending: isBuying,
    error: buyError,
  } = useWriteContract()

  // Wait for approval
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash })

  // Wait for purchase
  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } =
    useWaitForTransactionReceipt({ hash: buyHash })

  // Update step based on state
  useEffect(() => {
    if (!isConnected) {
      setStep("connect")
    } else if (allowance !== undefined && allowance < priceInUSDC) {
      setStep("approve")
    } else if (allowance !== undefined && allowance >= priceInUSDC) {
      setStep("pay")
    }
  }, [isConnected, allowance, priceInUSDC])

  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance()
      setStep("pay")
    }
  }, [isApproveSuccess, refetchAllowance])

  useEffect(() => {
    if (isBuyConfirming) {
      setStep("confirming")
    }
    if (isBuySuccess) {
      setStep("success")
    }
  }, [isBuyConfirming, isBuySuccess])

  useEffect(() => {
    if (approveError || buyError) {
      setError(approveError?.message || buyError?.message || "Transaction failed")
      setStep("error")
    }
  }, [approveError, buyError])

  const handleApprove = () => {
    approve({
      address: contracts.usdc,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contracts.flashCargo, priceInUSDC],
    })
  }

  const handleBuy = () => {
    buySlot({
      address: contracts.flashCargo,
      abi: FLASH_CARGO_ABI,
      functionName: "buySlot",
      args: [BigInt(dropId), BigInt(quantity)],
    })
  }

  const insufficientBalance = balance !== undefined && balance < priceInUSDC

  return (
    <Card className="p-6 bg-card border-primary/20">
      {/* Invoice Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold">Mystery Box Order</h3>
          <p className="text-sm text-muted-foreground">Drop #{dropId}</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/30">
          <Package className="w-3 h-3 mr-1" />
          {boxType.toUpperCase()}
        </Badge>
      </div>

      {/* Order Summary */}
      <div className="space-y-3 mb-6 p-4 bg-secondary/30 rounded-lg">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Box Type</span>
          <span className="font-medium capitalize">{boxType} ({BOX_ITEMS[boxType]} items)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quantity</span>
          <span className="font-medium">{quantity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Items</span>
          <span className="font-medium">{totalItems} items</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-bold">Total</span>
          <span className="font-bold text-primary text-xl">${totalPrice} USDC</span>
        </div>
      </div>

      {/* Balance Check */}
      {isConnected && balance !== undefined && (
        <div className="mb-4 text-sm">
          <span className="text-muted-foreground">Your USDC Balance: </span>
          <span className={insufficientBalance ? "text-destructive" : "text-green-500"}>
            ${formatUSDC(balance)}
          </span>
          {insufficientBalance && (
            <p className="text-destructive text-xs mt-1">
              Insufficient balance. Need ${totalPrice} USDC.
            </p>
          )}
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex items-center gap-1 text-xs ${step !== "connect" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step !== "connect" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {step !== "connect" ? <Check className="w-3 h-3" /> : "1"}
          </div>
          Connect
        </div>
        <ArrowRight className="w-3 h-3 text-muted-foreground" />
        <div className={`flex items-center gap-1 text-xs ${step === "pay" || step === "confirming" || step === "success" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "pay" || step === "confirming" || step === "success" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {step === "pay" || step === "confirming" || step === "success" ? <Check className="w-3 h-3" /> : "2"}
          </div>
          Approve
        </div>
        <ArrowRight className="w-3 h-3 text-muted-foreground" />
        <div className={`flex items-center gap-1 text-xs ${step === "success" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "success" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {step === "success" ? <Check className="w-3 h-3" /> : "3"}
          </div>
          Pay
        </div>
      </div>

      {/* Action Area */}
      <div className="space-y-4">
        {step === "connect" && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Connect your wallet to pay with USDC on Base
            </p>
            <WalletConnect />
          </div>
        )}

        {step === "approve" && (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Approve USDC spending to continue
            </p>
            <Button
              onClick={handleApprove}
              disabled={isApproving || isApproveConfirming || insufficientBalance}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isApproving || isApproveConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isApproveConfirming ? "Confirming..." : "Approving..."}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Approve ${totalPrice} USDC
                </>
              )}
            </Button>
          </>
        )}

        {step === "pay" && (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Ready to purchase your mystery box!
            </p>
            <Button
              onClick={handleBuy}
              disabled={isBuying || insufficientBalance}
              className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
            >
              {isBuying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Pay ${totalPrice} USDC
                </>
              )}
            </Button>
          </>
        )}

        {step === "confirming" && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium">Confirming Transaction...</p>
            <p className="text-sm text-muted-foreground">This may take a few seconds</p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xl font-bold text-green-500 mb-2">Payment Successful!</p>
            <p className="text-sm text-muted-foreground mb-4">
              Your NFT receipt has been minted. You&apos;ll receive your mystery box once the drop is funded and fulfilled.
            </p>
            {buyHash && (
              <a
                href={`https://${isTestnet ? "sepolia." : ""}basescan.org/tx/${buyHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                View Transaction →
              </a>
            )}
          </div>
        )}

        {step === "error" && (
          <div className="text-center py-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium text-destructive mb-2">Transaction Failed</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => setStep("pay")} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Escrow Protected
        </span>
        <span className="flex items-center gap-1">
          <Check className="w-3 h-3" />
          Auto-Refund Guarantee
        </span>
      </div>
    </Card>
  )
}
