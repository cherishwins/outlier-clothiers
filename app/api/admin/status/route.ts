import { type NextRequest, NextResponse } from "next/server"
import { CONTRACTS, isMainnetReady, getPublicClient } from "@/lib/contracts"
import { requireAdminToken } from "@/lib/auth"

// Admin endpoint to check system status.
// Operator-only: needs `Authorization: Bearer <ADMIN_TOKEN>`, and answers 503
// while ADMIN_TOKEN is unset. Read-only: it never creates a CDP account, and it
// reports each service as booleans. Failures are logged here, never echoed.

export async function GET(request: NextRequest) {
  const denied = requireAdminToken(request)
  if (denied) return denied

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
      deployed: false,
    },
    services: {
      database: await checkDatabase(),
      cdpWallet: await checkCdpWallet(),
      coinbase: checkCoinbaseConfig(),
      telegram: checkTelegramConfig(),
    },
    webhooks: {
      coinbase: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/coinbase`,
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

async function checkDatabase(): Promise<{ connected: boolean }> {
  try {
    const { PrismaClient } = await import("@prisma/client")
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
    return { connected: true }
  } catch (error) {
    console.error("[Admin Status] Database check failed:", error)
    return { connected: false }
  }
}

async function checkCdpWallet(): Promise<{
  configured: boolean
  reachable: boolean
  accountFound: boolean
  address?: string
}> {
  const configured = !!(
    process.env.CDP_API_KEY_ID &&
    process.env.CDP_API_KEY_SECRET
  )

  if (!configured) {
    return { configured, reachable: false, accountFound: false }
  }

  try {
    // Look up only: getCdpAccount() would create the account if it is missing.
    const { findCdpAccount } = await import("@/lib/cdp-wallet")
    const account = await findCdpAccount()
    return account
      ? { configured, reachable: true, accountFound: true, address: account.address }
      : { configured, reachable: true, accountFound: false }
  } catch (error) {
    console.error("[Admin Status] CDP wallet check failed:", error)
    return { configured, reachable: false, accountFound: false }
  }
}

function checkCoinbaseConfig(): { apiKey: boolean; webhookSecret: boolean } {
  // Without the webhook secret, /api/webhooks/coinbase refuses every event.
  return {
    apiKey: !!process.env.COINBASE_COMMERCE_API_KEY,
    webhookSecret: !!process.env.COINBASE_WEBHOOK_SECRET,
  }
}

function checkTelegramConfig(): { botToken: boolean; webhookSecret: boolean } {
  // Without the webhook secret, /api/webhooks/telegram refuses every update.
  return {
    botToken: !!process.env.TELEGRAM_BOT_TOKEN,
    webhookSecret: !!process.env.TELEGRAM_WEBHOOK_SECRET,
  }
}
