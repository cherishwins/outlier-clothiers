import { createPublicClient, http } from "viem"
import { base, baseSepolia } from "viem/chains"
import { CONTRACTS, FLASH_CARGO_ABI } from "./contracts"

interface QuoteDropParams {
  dropId: number
  quantity: number
  isTestnet: boolean
}

export interface DropQuote {
  dropId: number
  quantity: number
  slotPriceUsdc: bigint
  totalUsdc: bigint
  totalUsd: number
  totalStars: number
}

export interface DropState {
  targetAmount: bigint
  raisedAmount: bigint
  deadline: bigint
  slotPrice: bigint
  totalSlots: bigint
  slotsSold: bigint
  status: number
  manifestUri: string
}

export async function quoteDrop(params: QuoteDropParams): Promise<DropQuote> {
  const { dropId, quantity, isTestnet } = params
  if (!Number.isFinite(dropId) || dropId <= 0) {
    throw new Error("dropId must be a positive number")
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("quantity must be a positive number")
  }

  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base

  const client = createPublicClient({ chain, transport: http() })
  const slotPriceUsdc = await client.readContract({
    address: contracts.flashCargo,
    abi: FLASH_CARGO_ABI,
    functionName: "getCurrentSlotPrice",
    args: [BigInt(dropId)],
  })

  const totalUsdc = slotPriceUsdc * BigInt(quantity)

  // USDC has 6 decimals; USD ~= USDC
  const totalUsd = Number(totalUsdc) / 1_000_000

  // 1 Star ~= $0.01 => 1 Star ~= 0.01 USDC => 10,000 micro-USDC
  const totalStars = Number((totalUsdc + 9_999n) / 10_000n)

  return {
    dropId,
    quantity,
    slotPriceUsdc,
    totalUsdc,
    totalUsd,
    totalStars,
  }
}

export async function readDropState(params: { dropId: number; isTestnet: boolean }): Promise<DropState> {
  const { dropId, isTestnet } = params
  if (!Number.isFinite(dropId) || dropId <= 0) {
    throw new Error("dropId must be a positive number")
  }

  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base
  const client = createPublicClient({ chain, transport: http() })

  const result = await client.readContract({
    address: contracts.flashCargo,
    abi: FLASH_CARGO_ABI,
    functionName: "getDrop",
    args: [BigInt(dropId)],
  })

  const [
    targetAmount,
    raisedAmount,
    deadline,
    slotPrice,
    totalSlots,
    slotsSold,
    status,
    manifestUri,
  ] = result as unknown as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    number,
    string,
  ]

  return {
    targetAmount,
    raisedAmount,
    deadline,
    slotPrice,
    totalSlots,
    slotsSold,
    status,
    manifestUri,
  }
}

