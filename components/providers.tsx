"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { config } from "@/lib/wagmi-config"
import { useState, type ReactNode } from "react"
import { Toaster } from "@/components/ui/toaster"
import dynamic from "next/dynamic"

const VoiceConcierge = dynamic(
  () => import("@/components/assistant/VoiceConcierge").then((m) => ({ default: m.VoiceConcierge })),
  { ssr: false }
)

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
        <VoiceConcierge />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
