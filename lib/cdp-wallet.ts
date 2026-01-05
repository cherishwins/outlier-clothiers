import { CdpClient } from "@coinbase/cdp-sdk"
import {
  createPublicClient,
  http,
  encodeFunctionData,
  parseAbi,
  formatEther,
} from "viem"
import { base, baseSepolia } from "viem/chains"
import { CONTRACTS, FLASH_CARGO_ABI, ERC20_ABI, parseUSDC } from "./contracts"

// CDP Client singleton
let cdpClient: CdpClient | null = null

// CDP Account cache
interface CdpAccount {
  address: `0x${string}`
  name: string
}

let cachedAccount: CdpAccount | null = null

/**
 * Initialize CDP Client with credentials from environment
 */
export function initCdpClient(): CdpClient {
  if (cdpClient) return cdpClient

  const apiKeyId = process.env.CDP_API_KEY_ID
  const apiKeySecret = process.env.CDP_API_KEY_SECRET
  const walletSecret = process.env.CDP_WALLET_SECRET

  if (!apiKeyId || !apiKeySecret) {
    throw new Error("CDP_API_KEY_ID and CDP_API_KEY_SECRET must be set")
  }

  cdpClient = new CdpClient({
    apiKeyId,
    apiKeySecret,
    walletSecret,
  })

  console.log("[CDP Wallet] Client initialized")
  return cdpClient
}

/**
 * Get or create the main CDP wallet account for server operations
 */
export async function getCdpAccount(): Promise<CdpAccount> {
  if (cachedAccount) return cachedAccount

  const cdp = initCdpClient()
  const accountName = process.env.CDP_ACCOUNT_NAME || "outlier-server"

  try {
    // Try to list existing accounts
    const list = await cdp.evm.listAccounts()
    const existing = list.accounts.find((a) => a.name === accountName)

    if (existing) {
      const account: CdpAccount = {
        address: existing.address as `0x${string}`,
        name: existing.name ?? accountName,
      }
      cachedAccount = account
      console.log("[CDP Wallet] Using existing account:", account.address)
      return account
    }

    // Create new account if not found
    const newAccount = await cdp.evm.createAccount({ name: accountName })
    const account: CdpAccount = {
      address: newAccount.address as `0x${string}`,
      name: newAccount.name ?? accountName,
    }
    cachedAccount = account
    console.log("[CDP Wallet] Created new account:", account.address)
    return account
  } catch (error) {
    console.error("[CDP Wallet] Error getting account:", error)
    throw error
  }
}

/**
 * Get CDP wallet balance
 */
export async function getCdpBalance(isTestnet = true): Promise<{
  eth: string
  usdc: string
}> {
  const account = await getCdpAccount()
  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  const [ethBalance, usdcBalance] = await Promise.all([
    client.getBalance({ address: account.address }),
    client.readContract({
      address: contracts.usdc,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address],
    }),
  ])

  return {
    eth: formatEther(ethBalance),
    usdc: (Number(usdcBalance) / 1_000_000).toFixed(2),
  }
}

/**
 * Check and approve USDC spending for FlashCargo contract
 */
export async function ensureUsdcApproval(
  amount: bigint,
  isTestnet = true
): Promise<string | null> {
  const cdp = initCdpClient()
  const account = await getCdpAccount()
  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base
  const networkId = isTestnet ? "base-sepolia" : "base"

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  // Check current allowance
  const currentAllowance = await client.readContract({
    address: contracts.usdc,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, contracts.flashCargo],
  })

  if (currentAllowance >= amount) {
    console.log("[CDP Wallet] Sufficient USDC allowance:", currentAllowance.toString())
    return null
  }

  console.log("[CDP Wallet] Approving USDC spending...")

  // Encode approve function call
  const approveData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [contracts.flashCargo, amount * 10n], // Approve 10x to reduce future approvals
  })

  // Send approval transaction
  const txResult = await cdp.evm.sendTransaction({
    address: account.address,
    network: networkId,
    transaction: {
      to: contracts.usdc,
      data: approveData,
    },
  })

  console.log("[CDP Wallet] Approval tx:", txResult.transactionHash)
  return txResult.transactionHash
}

/**
 * Execute buySlot on FlashCargo contract
 * Used for Coinbase Commerce and Telegram payments where we need to execute on-chain
 */
export async function executeBuySlot(
  dropId: number,
  quantity: number,
  onBehalfOf: string // Customer wallet for tracking
): Promise<{
  success: boolean
  txHash?: string
  tokenId?: string
  error?: string
}> {
  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"
  const cdp = initCdpClient()
  const account = await getCdpAccount()
  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base
  const networkId = isTestnet ? "base-sepolia" : "base"

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  try {
    // Get current slot price
    const slotPrice = await client.readContract({
      address: contracts.flashCargo,
      abi: FLASH_CARGO_ABI,
      functionName: "getCurrentSlotPrice",
      args: [BigInt(dropId)],
    })

    const totalCost = slotPrice * BigInt(quantity)

    console.log("[CDP Wallet] Executing buySlot:", {
      dropId,
      quantity,
      slotPrice: slotPrice.toString(),
      totalCost: totalCost.toString(),
      onBehalfOf,
    })

    // Check USDC balance
    const balance = await client.readContract({
      address: contracts.usdc,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address],
    })

    if (balance < totalCost) {
      return {
        success: false,
        error: `Insufficient USDC balance. Need ${totalCost.toString()}, have ${balance.toString()}`,
      }
    }

    // Ensure approval
    await ensureUsdcApproval(totalCost, isTestnet)

    // Encode buySlot function call
    const buySlotData = encodeFunctionData({
      abi: FLASH_CARGO_ABI,
      functionName: "buySlot",
      args: [BigInt(dropId), BigInt(quantity)],
    })

    // Send transaction
    const txResult = await cdp.evm.sendTransaction({
      address: account.address,
      network: networkId,
      transaction: {
        to: contracts.flashCargo,
        data: buySlotData,
      },
    })

    console.log("[CDP Wallet] buySlot tx:", txResult.transactionHash)

    // Wait for confirmation
    const receipt = await client.waitForTransactionReceipt({
      hash: txResult.transactionHash as `0x${string}`,
    })

    if (receipt.status !== "success") {
      return {
        success: false,
        txHash: txResult.transactionHash,
        error: "Transaction failed",
      }
    }

    // Extract token ID from SlotPurchased event
    let tokenId: string | undefined
    const SLOT_PURCHASED_EVENT = parseAbi([
      "event SlotPurchased(uint256 indexed dropId, uint256 indexed tokenId, address buyer, uint256 amount)",
    ])

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === contracts.flashCargo.toLowerCase()) {
        try {
          const { decodeEventLog } = await import("viem")
          const decoded = decodeEventLog({
            abi: SLOT_PURCHASED_EVENT,
            data: log.data,
            topics: log.topics,
          })
          if (decoded.eventName === "SlotPurchased") {
            const args = decoded.args as { tokenId: bigint }
            tokenId = args.tokenId.toString()
            break
          }
        } catch {
          continue
        }
      }
    }

    return {
      success: true,
      txHash: txResult.transactionHash,
      tokenId,
    }
  } catch (error) {
    console.error("[CDP Wallet] buySlot error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Create a new drop on FlashCargo contract (admin function)
 */
export async function createDrop(params: {
  targetAmount: number // In USD
  durationDays: number
  baseSlotPrice: number // In USD
  totalSlots: number
  manifestUri: string
}): Promise<{
  success: boolean
  txHash?: string
  dropId?: number
  error?: string
}> {
  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"
  const cdp = initCdpClient()
  const account = await getCdpAccount()
  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base
  const networkId = isTestnet ? "base-sepolia" : "base"

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  try {
    // Convert USD amounts to USDC (6 decimals)
    const targetAmountUsdc = parseUSDC(params.targetAmount)
    const baseSlotPriceUsdc = parseUSDC(params.baseSlotPrice)

    console.log("[CDP Wallet] Creating drop:", {
      targetAmount: targetAmountUsdc.toString(),
      durationDays: params.durationDays,
      baseSlotPrice: baseSlotPriceUsdc.toString(),
      totalSlots: params.totalSlots,
      manifestUri: params.manifestUri,
    })

    // Encode createDrop function call
    const createDropData = encodeFunctionData({
      abi: FLASH_CARGO_ABI,
      functionName: "createDrop",
      args: [
        targetAmountUsdc,
        BigInt(params.durationDays),
        baseSlotPriceUsdc,
        BigInt(params.totalSlots),
        params.manifestUri,
      ],
    })

    // Send transaction
    const txResult = await cdp.evm.sendTransaction({
      address: account.address,
      network: networkId,
      transaction: {
        to: contracts.flashCargo,
        data: createDropData,
      },
    })

    console.log("[CDP Wallet] createDrop tx:", txResult.transactionHash)

    // Wait for confirmation
    const receipt = await client.waitForTransactionReceipt({
      hash: txResult.transactionHash as `0x${string}`,
    })

    if (receipt.status !== "success") {
      return {
        success: false,
        txHash: txResult.transactionHash,
        error: "Transaction failed",
      }
    }

    // Extract dropId from DropCreated event
    let dropId: number | undefined
    const DROP_CREATED_EVENT = parseAbi([
      "event DropCreated(uint256 indexed dropId, uint256 targetAmount, uint256 deadline, string manifestUri)",
    ])

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === contracts.flashCargo.toLowerCase()) {
        try {
          const { decodeEventLog } = await import("viem")
          const decoded = decodeEventLog({
            abi: DROP_CREATED_EVENT,
            data: log.data,
            topics: log.topics,
          })
          if (decoded.eventName === "DropCreated") {
            const args = decoded.args as { dropId: bigint }
            dropId = Number(args.dropId)
            break
          }
        } catch {
          continue
        }
      }
    }

    return {
      success: true,
      txHash: txResult.transactionHash,
      dropId,
    }
  } catch (error) {
    console.error("[CDP Wallet] createDrop error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Release funds from a funded drop (admin function)
 */
export async function releaseFunds(dropId: number): Promise<{
  success: boolean
  txHash?: string
  error?: string
}> {
  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"
  const cdp = initCdpClient()
  const account = await getCdpAccount()
  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base
  const networkId = isTestnet ? "base-sepolia" : "base"

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  try {
    console.log("[CDP Wallet] Releasing funds for drop:", dropId)

    const releaseFundsData = encodeFunctionData({
      abi: FLASH_CARGO_ABI,
      functionName: "releaseFunds",
      args: [BigInt(dropId)],
    })

    const txResult = await cdp.evm.sendTransaction({
      address: account.address,
      network: networkId,
      transaction: {
        to: contracts.flashCargo,
        data: releaseFundsData,
      },
    })

    console.log("[CDP Wallet] releaseFunds tx:", txResult.transactionHash)

    const receipt = await client.waitForTransactionReceipt({
      hash: txResult.transactionHash as `0x${string}`,
    })

    return {
      success: receipt.status === "success",
      txHash: txResult.transactionHash,
      error: receipt.status !== "success" ? "Transaction failed" : undefined,
    }
  } catch (error) {
    console.error("[CDP Wallet] releaseFunds error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Mark a drop as fulfilled (admin function)
 */
export async function markFulfilled(dropId: number): Promise<{
  success: boolean
  txHash?: string
  error?: string
}> {
  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"
  const cdp = initCdpClient()
  const account = await getCdpAccount()
  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base
  const networkId = isTestnet ? "base-sepolia" : "base"

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  try {
    console.log("[CDP Wallet] Marking drop as fulfilled:", dropId)

    const markFulfilledData = encodeFunctionData({
      abi: FLASH_CARGO_ABI,
      functionName: "markFulfilled",
      args: [BigInt(dropId)],
    })

    const txResult = await cdp.evm.sendTransaction({
      address: account.address,
      network: networkId,
      transaction: {
        to: contracts.flashCargo,
        data: markFulfilledData,
      },
    })

    console.log("[CDP Wallet] markFulfilled tx:", txResult.transactionHash)

    const receipt = await client.waitForTransactionReceipt({
      hash: txResult.transactionHash as `0x${string}`,
    })

    return {
      success: receipt.status === "success",
      txHash: txResult.transactionHash,
      error: receipt.status !== "success" ? "Transaction failed" : undefined,
    }
  } catch (error) {
    console.error("[CDP Wallet] markFulfilled error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
