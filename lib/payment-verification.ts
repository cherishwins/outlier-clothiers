import { createPublicClient, http, decodeEventLog, parseAbi } from "viem"
import { base, baseSepolia } from "viem/chains"
import { CONTRACTS, ERC20_ABI } from "./contracts"

// ERC20 Transfer event ABI
const TRANSFER_EVENT_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
])

interface VerifyPaymentParams {
  txHash: `0x${string}`
  expectedAmount?: bigint
  expectedRecipient?: `0x${string}`
  isTestnet?: boolean
}

interface VerificationResult {
  verified: boolean
  error?: string
  txHash: string
  sender?: string
  recipient?: string
  actualAmount?: string
  blockNumber?: bigint
  timestamp?: number
}

interface PaymentEvent {
  txHash: string
  sender: string
  recipient: string
  amount: bigint
  blockNumber: bigint
  timestamp: number
}

/**
 * Verify a USDC payment on-chain by checking transaction receipt
 */
export async function verifyPaymentOnChain(
  params: VerifyPaymentParams
): Promise<VerificationResult> {
  const { txHash, expectedAmount, expectedRecipient, isTestnet = true } = params

  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  try {
    // Get transaction receipt
    const receipt = await client.getTransactionReceipt({ hash: txHash })

    if (!receipt) {
      return {
        verified: false,
        error: "Transaction not found",
        txHash,
      }
    }

    if (receipt.status !== "success") {
      return {
        verified: false,
        error: "Transaction failed",
        txHash,
      }
    }

    // Find USDC Transfer events in the logs
    const transferLogs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === contracts.usdc.toLowerCase()
    )

    if (transferLogs.length === 0) {
      return {
        verified: false,
        error: "No USDC transfer found in transaction",
        txHash,
      }
    }

    // Decode the transfer events
    for (const log of transferLogs) {
      try {
        const decoded = decodeEventLog({
          abi: TRANSFER_EVENT_ABI,
          data: log.data,
          topics: log.topics,
        })

        if (decoded.eventName === "Transfer") {
          const { from, to, value } = decoded.args as {
            from: `0x${string}`
            to: `0x${string}`
            value: bigint
          }

          // Verify recipient if specified
          if (
            expectedRecipient &&
            to.toLowerCase() !== expectedRecipient.toLowerCase()
          ) {
            continue // Check next transfer in case of multi-transfer tx
          }

          // Verify amount if specified
          if (expectedAmount && value < expectedAmount) {
            return {
              verified: false,
              error: `Insufficient amount: expected ${expectedAmount}, got ${value}`,
              txHash,
              sender: from,
              recipient: to,
              actualAmount: value.toString(),
              blockNumber: receipt.blockNumber,
            }
          }

          // Get block timestamp
          const block = await client.getBlock({ blockNumber: receipt.blockNumber })

          return {
            verified: true,
            txHash,
            sender: from,
            recipient: to,
            actualAmount: value.toString(),
            blockNumber: receipt.blockNumber,
            timestamp: Number(block.timestamp),
          }
        }
      } catch {
        // Continue to next log if decode fails
        continue
      }
    }

    return {
      verified: false,
      error: "No matching USDC transfer found",
      txHash,
    }
  } catch (error) {
    console.error("[Payment Verification] Error:", error)
    return {
      verified: false,
      error: error instanceof Error ? error.message : "Unknown error",
      txHash,
    }
  }
}

/**
 * Watch for a payment event to the FlashCargo contract
 * Useful for detecting when a user has paid via direct wallet interaction
 */
export async function watchForSlotPurchase(params: {
  dropId: number
  buyerAddress: `0x${string}`
  isTestnet?: boolean
  timeoutMs?: number
}): Promise<PaymentEvent | null> {
  const {
    dropId,
    buyerAddress,
    isTestnet = true,
    timeoutMs = 120_000, // 2 minutes default
  } = params

  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  // FlashCargo SlotPurchased event
  const SLOT_PURCHASED_ABI = parseAbi([
    "event SlotPurchased(uint256 indexed dropId, uint256 indexed tokenId, address buyer, uint256 amount)",
  ])

  return new Promise((resolve) => {
    const startTime = Date.now()

    // Poll for the event
    const pollInterval = setInterval(async () => {
      try {
        // Get recent logs
        const logs = await client.getLogs({
          address: contracts.flashCargo,
          event: SLOT_PURCHASED_ABI[0],
          args: {
            dropId: BigInt(dropId),
          },
          fromBlock: "latest",
        })

        for (const log of logs) {
          try {
            const decoded = decodeEventLog({
              abi: SLOT_PURCHASED_ABI,
              data: log.data,
              topics: log.topics,
            })

            const args = decoded.args as {
              dropId: bigint
              tokenId: bigint
              buyer: `0x${string}`
              amount: bigint
            }

            if (args.buyer.toLowerCase() === buyerAddress.toLowerCase()) {
              clearInterval(pollInterval)

              const block = await client.getBlock({
                blockNumber: log.blockNumber,
              })

              resolve({
                txHash: log.transactionHash,
                sender: args.buyer,
                recipient: contracts.flashCargo,
                amount: args.amount,
                blockNumber: log.blockNumber,
                timestamp: Number(block.timestamp),
              })
              return
            }
          } catch {
            continue
          }
        }

        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(pollInterval)
          resolve(null)
        }
      } catch (error) {
        console.error("[Payment Watch] Poll error:", error)
      }
    }, 3000) // Poll every 3 seconds
  })
}

/**
 * Get USDC balance for an address
 */
export async function getUSDCBalance(
  address: `0x${string}`,
  isTestnet = true
): Promise<bigint> {
  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  const balance = await client.readContract({
    address: contracts.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
  })

  return balance
}

/**
 * Check if a transaction has been confirmed
 */
export async function isTransactionConfirmed(
  txHash: `0x${string}`,
  isTestnet = true
): Promise<boolean> {
  const chain = isTestnet ? baseSepolia : base

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash })
    return receipt?.status === "success"
  } catch {
    return false
  }
}

/**
 * Wait for a transaction to be confirmed
 */
export async function waitForTransaction(
  txHash: `0x${string}`,
  isTestnet = true,
  timeoutMs = 60_000
): Promise<boolean> {
  const chain = isTestnet ? baseSepolia : base

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  try {
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      timeout: timeoutMs,
    })
    return receipt.status === "success"
  } catch {
    return false
  }
}
