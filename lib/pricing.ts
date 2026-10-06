import { createPublicClient, http } from "viem"
import { base, baseSepolia } from "viem/chains"
import { CONTRACTS, DropStatus, FLASH_CARGO_ABI, formatUSDC, getIsTestnet } from "./contracts"
import { parseDropId } from "./drop-id"

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
  if (parseDropId(dropId) === null) {
    throw new Error("dropId must be a non-negative integer")
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
  if (parseDropId(dropId) === null) {
    throw new Error("dropId must be a non-negative integer")
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


/** A drop that is on sale now, as read from the contract; plain values so it can go to the client. */
export interface OpenDrop {
  dropId: number
  slotPriceUsd: string // next slot's price, "15.00"
  slotPriceStars: number
  raisedUsd: string
  targetUsd: string
  progressPercent: number // 0-100
  slotsSold: number
  totalSlots: number
  deadline: number // unix seconds
  manifestUri: string
}

const MAX_DROPS_LISTED = 25

/**
 * The drops currently on sale (status FUNDING, before the deadline), newest
 * first, straight from FlashCargo. Nothing here is a placeholder: no drops on
 * the contract means an empty list.
 */
export async function listOpenDrops(isTestnet: boolean): Promise<OpenDrop[]> {
  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base
  const client = createPublicClient({ chain, transport: http() })

  const count = Number(
    await client.readContract({ address: contracts.flashCargo, abi: FLASH_CARGO_ABI, functionName: "nextDropId" })
  )
  const ids: number[] = []
  for (let id = count - 1; id >= 0 && ids.length < MAX_DROPS_LISTED; id--) ids.push(id)

  const now = BigInt(Math.floor(Date.now() / 1000))
  const drops = await Promise.all(
    ids.map(async (dropId) => {
      const state = await readDropState({ dropId, isTestnet })
      if (state.status !== DropStatus.FUNDING || state.deadline <= now) return null
      const price = await client.readContract({
        address: contracts.flashCargo,
        abi: FLASH_CARGO_ABI,
        functionName: "getCurrentSlotPrice",
        args: [BigInt(dropId)],
      })
      const progress =
        state.targetAmount > BigInt(0) ? (state.raisedAmount * BigInt(100)) / state.targetAmount : BigInt(0)
      return {
        dropId,
        slotPriceUsd: formatUSDC(price),
        // Same rounding as quoteDrop: 1 Star ~= $0.01, rounded up.
        slotPriceStars: Number((price + BigInt(9_999)) / BigInt(10_000)),
        raisedUsd: formatUSDC(state.raisedAmount),
        targetUsd: formatUSDC(state.targetAmount),
        progressPercent: Number(progress > BigInt(100) ? BigInt(100) : progress),
        slotsSold: Number(state.slotsSold),
        totalSlots: Number(state.totalSlots),
        deadline: Number(state.deadline),
        manifestUri: state.manifestUri,
      } satisfies OpenDrop
    })
  )
  return drops.filter((d): d is OpenDrop => d !== null)
}

/** listOpenDrops for a page: null (logged) when the chain cannot be read, so the page can say so. */
export async function getOpenDrops(): Promise<OpenDrop[] | null> {
  try {
    return await listOpenDrops(getIsTestnet())
  } catch (error) {
    console.error("[Drops] Could not read drops from the contract:", error)
    return null
  }
}
