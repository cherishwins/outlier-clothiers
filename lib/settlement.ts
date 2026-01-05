import { PrismaClient, type Prisma } from "@prisma/client"
import { CONTRACTS, formatUSDC } from "./contracts"
import { verifyPaymentOnChain, waitForTransaction } from "./payment-verification"

// Initialize Prisma client
const prisma = new PrismaClient()

// Shipping address interface
interface ShippingAddress {
  name?: string
  street1?: string
  street2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
  raw?: string
}

// Settlement request interface
export interface SettlementRequest {
  dropId: number
  quantity: number
  customerWallet: string
  customerEmail?: string
  shippingAddress: ShippingAddress | object
  paymentMethod: "x402" | "coinbase" | "telegram"
  paymentTxHash?: string
  paymentAmount: number
  // Optional payment-specific fields
  coinbaseChargeId?: string
  telegramPaymentId?: string
  telegramUserId?: number
}

// Order result interface (matches Prisma Order model)
interface OrderResult {
  id: string
  drop_id: string
  customer_wallet: string
  customer_email: string | null
  customer_name: string | null
  shipping_address: unknown
  shipping_cost: number
  tracking_number: string | null
  shipping_label_url: string | null
  carrier: string | null
  payment_method: string
  payment_amount: number
  payment_currency: string
  payment_tx_hash: string | null
  receipt_nft_id: string | null
  receipt_nft_tx: string | null
  status: string
  paid_at: Date | null
  shipped_at: Date | null
  delivered_at: Date | null
  customer_confirmed: boolean
  created_at: Date
  updated_at: Date
}

/**
 * Main settlement function - creates order in database and handles payment processing
 */
export async function settleOrder(request: SettlementRequest): Promise<OrderResult> {
  const {
    dropId,
    quantity,
    customerWallet,
    customerEmail,
    shippingAddress,
    paymentMethod,
    paymentTxHash,
    paymentAmount,
    coinbaseChargeId,
    telegramPaymentId,
    telegramUserId,
  } = request

  console.log("[Settlement] Processing order:", {
    dropId,
    quantity,
    customerWallet,
    paymentMethod,
    paymentAmount,
  })

  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === "true"
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base

  try {
    const idempotencyKey = paymentTxHash || coinbaseChargeId || telegramPaymentId
    const existingByPayment = idempotencyKey
      ? await prisma.order.findFirst({
          where: { payment_tx_hash: idempotencyKey },
        })
      : null

    // If we've already processed this payment end-to-end, return the existing order
    if (existingByPayment && existingByPayment.status !== "pending") {
      console.log("[Settlement] Idempotent replay detected. Returning existing order:", existingByPayment.id)
      return existingByPayment
    }

    // 1. Verify on-chain payment if txHash provided
    if (paymentTxHash && paymentMethod === "x402") {
      const verification = await verifyPaymentOnChain({
        txHash: paymentTxHash as `0x${string}`,
        isTestnet,
      })

      if (!verification.verified) {
        throw new Error(`Payment verification failed: ${verification.error}`)
      }

      console.log("[Settlement] Payment verified on-chain:", verification)
    }

    // 2. Get or create the drop in database
    let drop = await prisma.drop.findFirst({
      where: {
        // Match by contract dropId - stored in name or separate field
        // For now, we'll use a convention: "Drop #X" format
        name: { contains: `#${dropId}` },
      },
    })

    // If drop doesn't exist, create a placeholder (in production, this should fail)
    if (!drop) {
      console.log("[Settlement] Creating placeholder drop for ID:", dropId)
      drop = await prisma.drop.create({
        data: {
          name: `Drop #${dropId}`,
          source: "FlashCargo Contract",
          pallet_cost: 0,
          box_price: paymentAmount / quantity,
          boxes_needed: 1000, // Default
          funding_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          manifest: {},
          images: [],
          contract_address: contracts.flashCargo,
        },
      })
    }

    // 3. Calculate shipping cost (can be enhanced with EasyPost integration)
    const estimatedShippingCost = calculateShippingEstimate(shippingAddress)

    // 4. Create order in database
    const orderData = {
      drop_id: drop.id,
      customer_wallet: customerWallet,
      customer_email: customerEmail || null,
      customer_name: extractCustomerName(shippingAddress),
      shipping_address: shippingAddress as object,
      shipping_cost: estimatedShippingCost,
      payment_method: paymentMethod,
      payment_amount: paymentAmount,
      payment_currency: paymentMethod === "telegram" ? "STARS" : "USDC",
      payment_tx_hash: idempotencyKey || null,
      status: "pending",
    }

    const order = existingByPayment
      ? await prisma.order.update({
          where: { id: existingByPayment.id },
          data: orderData,
        })
      : await prisma.order.create({ data: orderData })

    console.log("[Settlement] Order created:", order.id)

    // 5. Handle payment method specific logic
    let receiptNftId: string | null = null
    let receiptNftTx: string | null = null

    if (paymentMethod === "x402" && paymentTxHash) {
      // Direct on-chain payment - NFT already minted via buySlot()
      // Try to extract token ID from transaction logs
      const nftDetails = await extractNftFromTransaction(
        paymentTxHash as `0x${string}`,
        isTestnet
      )
      if (nftDetails) {
        receiptNftId = nftDetails.tokenId
        receiptNftTx = paymentTxHash
      }
    } else if (paymentMethod === "coinbase" || paymentMethod === "telegram") {
      // Off-chain payment - need to execute buySlot via CDP wallet
      try {
        const { executeBuySlot } = await import("./cdp-wallet")
        const buySlotResult = await executeBuySlot(dropId, quantity, customerWallet)
        
        if (buySlotResult.success) {
          receiptNftTx = buySlotResult.txHash ?? null
          // Wait for transaction and extract NFT ID
          if (buySlotResult.txHash) {
            const confirmed = await waitForTransaction(
              buySlotResult.txHash as `0x${string}`,
              isTestnet
            )
            if (confirmed) {
              const nftDetails = await extractNftFromTransaction(
                buySlotResult.txHash as `0x${string}`,
                isTestnet
              )
              if (nftDetails) {
                receiptNftId = nftDetails.tokenId
              }
            }
          }
        }
      } catch (error) {
        console.error("[Settlement] CDP buySlot failed:", error)
        // Continue without NFT - can be minted later
      }
    }

    // 6. Update order with NFT details and mark as paid
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        receipt_nft_id: receiptNftId,
        receipt_nft_tx: receiptNftTx,
        status: "paid",
        paid_at: new Date(),
      },
    })

    // 7. Update drop boxes_sold count
    await prisma.drop.update({
      where: { id: drop.id },
      data: {
        boxes_sold: {
          increment: quantity,
        },
      },
    })

    // 8. Update or create user record
    await upsertUser(customerWallet, customerEmail, paymentAmount, telegramUserId)

    console.log("[Settlement] Order completed:", updatedOrder.id)

    return updatedOrder
  } catch (error) {
    console.error("[Settlement] Error settling order:", error)
    throw error
  }
}

/**
 * Calculate estimated shipping cost based on address
 */
function calculateShippingEstimate(address: ShippingAddress | object): number {
  const addr = address as ShippingAddress
  
  // Default domestic shipping
  let baseCost = 8.99

  // International shipping estimate
  if (addr.country && addr.country !== "US" && addr.country !== "USA") {
    baseCost = 24.99
  }

  // Add surcharge for larger quantities (will be multiplied by quantity in actual shipping)
  return baseCost
}

/**
 * Extract customer name from shipping address
 */
function extractCustomerName(address: ShippingAddress | object): string | null {
  const addr = address as ShippingAddress
  return addr.name || null
}

/**
 * Extract NFT token ID from a buySlot transaction
 */
async function extractNftFromTransaction(
  txHash: `0x${string}`,
  isTestnet: boolean
): Promise<{ tokenId: string } | null> {
  const { createPublicClient, http, decodeEventLog, parseAbi } = await import("viem")
  const { base, baseSepolia } = await import("viem/chains")

  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base

  const client = createPublicClient({
    chain,
    transport: http(),
  })

  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash })
    if (!receipt) return null

    // Look for SlotPurchased event
    const SLOT_PURCHASED_ABI = parseAbi([
      "event SlotPurchased(uint256 indexed dropId, uint256 indexed tokenId, address buyer, uint256 amount)",
    ])

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === contracts.flashCargo.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: SLOT_PURCHASED_ABI,
            data: log.data,
            topics: log.topics,
          })

          if (decoded.eventName === "SlotPurchased") {
            const args = decoded.args as { tokenId: bigint }
            return { tokenId: args.tokenId.toString() }
          }
        } catch {
          continue
        }
      }
    }

    // Also check for ERC721 Transfer event (minting)
    const TRANSFER_ABI = parseAbi([
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    ])

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === contracts.flashCargo.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: TRANSFER_ABI,
            data: log.data,
            topics: log.topics,
          })

          if (decoded.eventName === "Transfer") {
            const args = decoded.args as {
              from: string
              to: string
              tokenId: bigint
            }
            // Check if it's a mint (from zero address)
            if (args.from === "0x0000000000000000000000000000000000000000") {
              return { tokenId: args.tokenId.toString() }
            }
          }
        } catch {
          continue
        }
      }
    }

    return null
  } catch (error) {
    console.error("[Settlement] Error extracting NFT:", error)
    return null
  }
}

/**
 * Update or create user record
 */
async function upsertUser(
  walletAddress: string,
  email?: string,
  amount?: number,
  telegramId?: number
): Promise<void> {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { wallet_address: walletAddress },
    })

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { wallet_address: walletAddress },
        data: {
          email: email || existingUser.email,
          telegram_id: telegramId?.toString() || existingUser.telegram_id,
          total_orders: { increment: 1 },
          total_spent: { increment: amount || 0 },
        },
      })
    } else {
      // Create new user with referral code
      const referralCode = generateReferralCode(walletAddress)
      await prisma.user.create({
        data: {
          wallet_address: walletAddress,
          email: email,
          telegram_id: telegramId?.toString(),
          referral_code: referralCode,
          total_orders: 1,
          total_spent: amount || 0,
        },
      })
    }
  } catch (error) {
    console.error("[Settlement] Error upserting user:", error)
    // Non-critical error, don't throw
  }
}

/**
 * Generate a unique referral code
 */
function generateReferralCode(walletAddress: string): string {
  // Use first 4 and last 4 chars of wallet + random suffix
  const prefix = walletAddress.slice(2, 6).toUpperCase()
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${suffix}`
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<OrderResult | null> {
  return prisma.order.findUnique({
    where: { id: orderId },
  })
}

/**
 * Get orders for a customer
 */
export async function getCustomerOrders(customerWallet: string): Promise<OrderResult[]> {
  return prisma.order.findMany({
    where: { customer_wallet: customerWallet },
    orderBy: { created_at: "desc" },
  })
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  additionalData?: Prisma.OrderUpdateInput
): Promise<OrderResult> {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...additionalData,
    },
  })
}
