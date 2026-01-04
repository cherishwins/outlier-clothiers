import { type NextRequest, NextResponse } from "next/server"
import { CONTRACTS, isMainnetReady, getPublicClient } from "@/lib/contracts"

// Admin endpoint to check system status
// Should be protected with authentication in production

export async function GET(request: NextRequest) {
  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base
  const client = getPublicClient(isTestnet)

  const status = {
    environment: {
      isTestnet,
      network: isTestnet ? "base-sepolia" : "base",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "not set",
    },
    contracts: {
      flashCargo: contracts.flashCargo || "not deployed",
      usdc: contracts.usdc,
      mainnetReady: isMainnetReady(),
    },
    services: {
      database: await checkDatabase(),
      cdpWallet: await checkCdpWallet(),
      coinbase: checkCoinbaseConfig(),
      telegram: checkTelegramConfig(),
    },
    webhooks: {
      coinbase: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/coinbase`,
      x402: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/x402`,
      telegram: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telegram`,
    },
  }

  // Check contract status on-chain if deployed
  if (contracts.flashCargo) {
    try {
      const code = await client.getCode({ address: contracts.flashCargo })
      status.contracts.deployed = !!code && code !== "0x"
    } catch {
      status.contracts.deployed = false
    }
  }

  return NextResponse.json(status)
}

async function checkDatabase(): Promise<{ status: string; error?: string }> {
  try {
    const { PrismaClient } = await import("@prisma/client")
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
    return { status: "connected" }
  } catch (error) {
    return { 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

async function checkCdpWallet(): Promise<{ status: string; address?: string; error?: string }> {
  try {
    const hasConfig = !!(
      process.env.CDP_API_KEY_ID && 
      process.env.CDP_API_KEY_SECRET
    )
    
    if (!hasConfig) {
      return { status: "not configured" }
    }

    const { getCdpAccount } = await import("@/lib/cdp-wallet")
    const account = await getCdpAccount()
    return { 
      status: "connected", 
      address: account.address 
    }
  } catch (error) {
    return { 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

function checkCoinbaseConfig(): { status: string } {
  const hasApiKey = !!process.env.COINBASE_COMMERCE_API_KEY
  const hasWebhookSecret = !!process.env.COINBASE_WEBHOOK_SECRET
  
  if (hasApiKey && hasWebhookSecret) {
    return { status: "configured" }
  } else if (hasApiKey) {
    return { status: "partial (missing webhook secret)" }
  }
  return { status: "not configured" }
}

function checkTelegramConfig(): { status: string } {
  const hasBotToken = !!process.env.TELEGRAM_BOT_TOKEN
  const hasWebhookSecret = !!process.env.TELEGRAM_WEBHOOK_SECRET
  
  if (hasBotToken && hasWebhookSecret) {
    return { status: "configured" }
  } else if (hasBotToken) {
    return { status: "partial (missing webhook secret)" }
  }
  return { status: "not configured" }
}
