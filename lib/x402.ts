import { PrismaClient, type X402Payment } from "@prisma/client"
import { createPublicClient, http } from "viem"
import { base, baseSepolia } from "viem/chains"
import {
  settlementCalldata,
  USDC_BASE,
  USDC_BASE_SEPOLIA,
  type Authorization,
  type PriceOptions,
  type TokenDomain,
} from "x402-merchant"

import { getIsTestnet } from "./contracts"
import { quoteDrop } from "./pricing"

/**
 * x402 for a drop: the buyer signs one EIP-3009 authorization for the slot
 * price to the shop's wallet; the shop's CDP server wallet collects it and
 * then funds the escrow contract on the buyer's behalf, exactly as the
 * Coinbase and Telegram rails already do. The buyer pays no gas and sends
 * no transaction. Nothing here is a custodian: the recipient and the amount
 * are inside the buyer's signature, and the shop can only press send.
 *
 * Engine: x402-merchant (cherishwins/x402-facilitator). Verification is
 * offline; the nonce is spent once through a UNIQUE column.
 */

const prisma = new PrismaClient()

const ADDRESS = /^0x[0-9a-fA-F]{40}$/

export function x402Token(): TokenDomain {
  return getIsTestnet() ? USDC_BASE_SEPOLIA : USDC_BASE
}

/** The shop's receiving address. Set it to the CDP server wallet so the funds land where buySlot spends them. */
export function x402PayTo(): `0x${string}` | null {
  const v = process.env.X402_PAYMENT_ADDRESS?.trim()
  return v && ADDRESS.test(v) ? (v as `0x${string}`) : null
}

export function x402Enabled(): boolean {
  return x402PayTo() !== null
}

export function cdpConfigured(): boolean {
  return Boolean(
    process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET && process.env.CDP_WALLET_SECRET
  )
}

/** The contract reports no price: the drop does not exist there or is not selling. */
export class NotForSale extends Error {}

export interface X402Quote {
  dropId: number
  quantity: number
  amountUnits: bigint
  totalUsd: number
  price: PriceOptions
}

/** The price of `quantity` slots of a drop, from the contract, as a 402 offer. */
export async function x402Quote(dropId: number, quantity: number, resource: string): Promise<X402Quote> {
  const payTo = x402PayTo()
  if (!payTo) throw new Error("X402_PAYMENT_ADDRESS is not set")
  const quote = await quoteDrop({ dropId, quantity, isTestnet: getIsTestnet() })
  if (quote.totalUsdc <= BigInt(0)) throw new NotForSale(`drop #${dropId} has no slot price on the contract`)
  return {
    dropId,
    quantity,
    amountUnits: quote.totalUsdc,
    totalUsd: quote.totalUsd,
    price: {
      payTo,
      amountUnits: quote.totalUsdc,
      token: x402Token(),
      resource,
      description: `Outlier Clothiers drop #${dropId}, ${quantity} slot${quantity === 1 ? "" : "s"}`,
      timeoutSeconds: 15 * 60,
    },
  }
}

export interface ClaimInput {
  payer: `0x${string}`
  nonce: `0x${string}`
  authorization: Authorization
  signature: string
}

/** Record the authorization under its nonce. A second claim of the same nonce is a replay. */
export async function claimX402(quote: X402Quote, input: ClaimInput): Promise<X402Payment | "already_used"> {
  try {
    return await prisma.x402Payment.create({
      data: {
        nonce: input.nonce.toLowerCase(),
        payer: input.payer,
        pay_to: quote.price.payTo,
        network: x402Token().network,
        drop_id: quote.dropId,
        quantity: quote.quantity,
        amount_units: quote.amountUnits,
        authorization: input.authorization as unknown as object,
        signature: input.signature,
        status: "authorized",
      },
    })
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") return "already_used"
    throw error
  }
}

export async function seenNonce(nonce: string): Promise<boolean> {
  const row = await prisma.x402Payment.findUnique({ where: { nonce: nonce.toLowerCase() }, select: { id: true } })
  return row !== null
}

export type SettleX402Result =
  | { ok: true; txHash: `0x${string}` }
  | { ok: false; error: string; configured: boolean }

function shortError(error: unknown): string {
  if (error && typeof error === "object" && "shortMessage" in error) {
    return String((error as { shortMessage: unknown }).shortMessage)
  }
  return error instanceof Error ? error.message : String(error)
}

/**
 * Collect the authorization with the CDP server wallet: one transaction to
 * the token contract carrying the buyer's signature. The wallet pays gas and
 * has no say over amount or recipient.
 */
export async function settleX402(payment: X402Payment): Promise<SettleX402Result> {
  if (!cdpConfigured()) return { ok: false, error: "settlement wallet is not configured", configured: false }
  const token = x402Token()
  const isTestnet = getIsTestnet()
  const client = createPublicClient({ chain: isTestnet ? baseSepolia : base, transport: http() })

  try {
    const { initCdpClient, getCdpAccount } = await import("./cdp-wallet")
    const cdp = initCdpClient()
    const account = await getCdpAccount()
    const data = settlementCalldata(payment.authorization as Record<string, unknown>, payment.signature)

    // Dry run first: a revert here costs nothing and names its reason.
    await client.call({ account: account.address, to: token.address, data })

    const sent = await cdp.evm.sendTransaction({
      address: account.address,
      network: isTestnet ? "base-sepolia" : "base",
      transaction: { to: token.address, data },
    })
    const txHash = sent.transactionHash as `0x${string}`
    await prisma.x402Payment.update({ where: { id: payment.id }, data: { status: "broadcast", tx_hash: txHash } })

    const receipt = await client.waitForTransactionReceipt({ hash: txHash, timeout: 90_000 })
    if (receipt.status !== "success") {
      await prisma.x402Payment.update({ where: { id: payment.id }, data: { status: "failed", error: `transaction ${txHash} reverted` } })
      return { ok: false, error: "the transfer reverted on chain", configured: true }
    }
    await prisma.x402Payment.update({
      where: { id: payment.id },
      data: { status: "settled", tx_hash: txHash, error: null, settled_at: new Date() },
    })
    return { ok: true, txHash }
  } catch (error) {
    const message = shortError(error)
    console.error("[x402] settlement failed:", message)
    await prisma.x402Payment.update({ where: { id: payment.id }, data: { status: "failed", error: message.slice(0, 2000) } })
    return { ok: false, error: message, configured: true }
  }
}

export async function attachOrder(paymentId: string, orderId: string): Promise<void> {
  await prisma.x402Payment.update({ where: { id: paymentId }, data: { order_id: orderId } })
}
