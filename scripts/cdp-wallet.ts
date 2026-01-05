import { CdpClient } from "@coinbase/cdp-sdk"
import { createPublicClient, formatEther, http, parseAbi } from "viem"
import { base } from "viem/chains"

const ERC20_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
])

// Base mainnet USDC
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const

async function main() {
  console.log("Initializing CDP Client...\n")

  try {
    const apiKeyId = process.env.CDP_API_KEY_ID
    const apiKeySecret = process.env.CDP_API_KEY_SECRET
    const walletSecret = process.env.CDP_WALLET_SECRET
    const accountName = process.env.CDP_ACCOUNT_NAME || "outlier-deployer"

    if (!apiKeyId || !apiKeySecret) {
      throw new Error("Missing CDP_API_KEY_ID / CDP_API_KEY_SECRET")
    }

    const cdp = new CdpClient({
      apiKeyId,
      apiKeySecret,
      walletSecret,
    })

    console.log("CDP Client initialized.")

    // Get or create an EVM account on Base
    const list = await cdp.evm.listAccounts()
    const existing = list.accounts.find((a) => a.name === accountName)
    const account = existing ?? (await cdp.evm.createAccount({ name: accountName }))

    console.log("Account address:", account.address)

    // Check on-chain balances via viem
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    })

    const [eth, usdc] = await Promise.all([
      publicClient.getBalance({ address: account.address as `0x${string}` }),
      publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address as `0x${string}`],
      }),
    ])

    console.log("ETH:", formatEther(eth))
    console.log("USDC:", (Number(usdc) / 1_000_000).toFixed(2))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Error:", message)
  }
}

main()
