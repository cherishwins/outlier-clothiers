"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, Copy, Check } from "lucide-react"
import { useState } from "react"

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyAddress}
          className="font-mono text-xs border-primary/30 hover:border-primary"
        >
          {copied ? (
            <Check className="w-3 h-3 mr-1 text-green-500" />
          ) : (
            <Copy className="w-3 h-3 mr-1" />
          )}
          {address.slice(0, 6)}...{address.slice(-4)}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => disconnect()}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isPending ? "Connecting..." : `Connect ${connector.name}`}
        </Button>
      ))}
    </div>
  )
}

// Compact version for header
export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => disconnect()}
        className="font-mono text-xs border-primary/30 hover:border-primary gap-2"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    )
  }

  return (
    <Button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      size="sm"
      className="bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isPending ? "..." : "Connect"}
    </Button>
  )
}
