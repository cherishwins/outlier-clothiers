import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Contract addresses (update after deployment)
export const CONTRACTS = {
  // Base Sepolia (testnet)
  baseSepolia: {
    flashCargo: '' as `0x${string}`, // Deploy and fill in
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`, // Base Sepolia USDC
  },
  // Base Mainnet
  base: {
    flashCargo: '' as `0x${string}`, // Deploy and fill in
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // Base USDC
  },
}

// FlashCargo ABI (minimal for frontend)
export const FLASH_CARGO_ABI = parseAbi([
  // Read functions
  'function getDrop(uint256 dropId) view returns (uint256 targetAmount, uint256 raisedAmount, uint256 deadline, uint256 slotPrice, uint256 totalSlots, uint256 slotsSold, uint8 status, string manifestUri)',
  'function getCurrentSlotPrice(uint256 dropId) view returns (uint256)',
  'function getFundingProgress(uint256 dropId) view returns (uint256)',
  'function canClaimRefund(uint256 tokenId) view returns (bool)',
  'function slots(uint256 tokenId) view returns (uint256 dropId, uint256 amount, bool refunded, bool claimed)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',

  // Write functions
  'function buySlot(uint256 dropId, uint256 quantity) external',
  'function claimRefund(uint256 tokenId) external',
  'function claimOrder(uint256 tokenId) external',

  // Admin functions
  'function createDrop(uint256 targetAmount, uint256 durationDays, uint256 baseSlotPrice, uint256 totalSlots, string manifestUri) external returns (uint256)',
  'function releaseFunds(uint256 dropId) external',
  'function cancelDrop(uint256 dropId) external',
  'function markFulfilled(uint256 dropId) external',

  // Events
  'event SlotPurchased(uint256 indexed dropId, uint256 indexed tokenId, address buyer, uint256 amount)',
  'event DropFunded(uint256 indexed dropId, uint256 totalRaised)',
  'event Refunded(uint256 indexed tokenId, address buyer, uint256 amount)',
])

// ERC20 ABI for USDC approval
export const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
])

// Drop status enum matching contract
export const DropStatus = {
  FUNDING: 0,
  FUNDED: 1,
  CANCELLED: 2,
  FULFILLED: 3,
} as const

// Helper to get chain config
export function getChainConfig(isTestnet = true) {
  const chain = isTestnet ? baseSepolia : base
  const contracts = isTestnet ? CONTRACTS.baseSepolia : CONTRACTS.base
  return { chain, contracts }
}

// Create public client for reading
export function getPublicClient(isTestnet = true) {
  const { chain } = getChainConfig(isTestnet)
  return createPublicClient({
    chain,
    transport: http(),
  })
}

// Format USDC amount (6 decimals)
export function formatUSDC(amount: bigint): string {
  return (Number(amount) / 1_000_000).toFixed(2)
}

// Parse USDC amount to bigint
export function parseUSDC(amount: number): bigint {
  return BigInt(Math.floor(amount * 1_000_000))
}
