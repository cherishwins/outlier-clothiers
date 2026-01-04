/**
 * Deploy FlashCargo contract to Base Sepolia
 *
 * Usage:
 * PRIVATE_KEY=0x... npx tsx scripts/deploy-contract.ts
 */

import { createWalletClient, createPublicClient, http, parseAbi } from "viem"
import { baseSepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

// FlashCargo bytecode (compiled from Solidity)
// NOTE: This needs to be replaced with actual compiled bytecode
// For now, we'll use a simplified version that can be compiled inline

const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`

  if (!privateKey) {
    console.error("Error: PRIVATE_KEY environment variable required")
    console.log("Usage: PRIVATE_KEY=0x... npx tsx scripts/deploy-contract.ts")
    process.exit(1)
  }

  const account = privateKeyToAccount(privateKey)

  console.log("Deploying FlashCargo contract...")
  console.log("Deployer:", account.address)
  console.log("Network: Base Sepolia")
  console.log("USDC Address:", USDC_BASE_SEPOLIA)
  console.log("")

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  })

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  })

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address })
  console.log("Deployer ETH Balance:", Number(balance) / 1e18, "ETH")

  if (balance < BigInt(1e16)) {
    // Less than 0.01 ETH
    console.error("Error: Insufficient ETH for gas. Need at least 0.01 ETH")
    console.log("Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet")
    process.exit(1)
  }

  // For actual deployment, you would:
  // 1. Compile FlashCargo.sol with solc
  // 2. Get the bytecode
  // 3. Deploy with walletClient.deployContract()

  console.log("")
  console.log("To complete deployment:")
  console.log("1. Install Foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup")
  console.log("2. Run: cd contracts && forge build")
  console.log(
    "3. Run: forge create --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY src/FlashCargo.sol:FlashCargo --constructor-args",
    USDC_BASE_SEPOLIA
  )
  console.log("")
  console.log("Or use Remix IDE:")
  console.log("1. Go to https://remix.ethereum.org")
  console.log("2. Create FlashCargo.sol with the contract code")
  console.log("3. Compile with Solidity 0.8.20")
  console.log("4. Deploy to Base Sepolia with MetaMask")
  console.log("5. Constructor arg: " + USDC_BASE_SEPOLIA)
}

main().catch(console.error)
