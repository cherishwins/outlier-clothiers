import { CdpClient, type EvmServerAccount } from "@coinbase/cdp-sdk";
import { createPublicClient, http, encodeDeployData, formatEther } from "viem";
import { base } from "viem/chains";
import * as fs from "fs";
import * as path from "path";

// Base mainnet USDC
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

async function main() {
  console.log("🚀 Initializing CDP Client...\n");

  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    walletSecret: process.env.CDP_WALLET_SECRET!,
  });

  // Get or create account
  console.log("📍 Getting EVM account...");
  let account: EvmServerAccount;
  try {
    // Try to get existing account by name
    const list = await cdp.evm.listAccounts();
    const existing = list.accounts.find((a) => a.name === "outlier-deployer");
    if (existing) {
      account = existing;
      console.log("   Using existing account:", account.address);
    } else {
      account = await cdp.evm.createAccount({ name: "outlier-deployer-2" });
      console.log("   Created new account:", account.address);
    }
  } catch {
    account = await cdp.evm.createAccount({ name: "outlier-deployer-3" });
    console.log("   Created account:", account.address);
  }

  // Check balance using viem
  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const balance = await publicClient.getBalance({ address: account.address as `0x${string}` });
  console.log("💰 Balance:", formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("\n⚠️  Wallet needs ETH for gas!");
    console.log("   Send ETH on Base to:", account.address);
    console.log("\n   In Coinbase Wallet app:");
    console.log("   1. ETH → Send");
    console.log("   2. Network: Base");
    console.log("   3. Address:", account.address);
    console.log("   4. Amount: ~0.005 ETH (~$15)");
    return;
  }

  // Read compiled contract
  console.log("\n📄 Loading FlashCargo contract...");
  const contractJson = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../contracts/out/FlashCargo.sol/FlashCargo.json"),
      "utf-8"
    )
  );

  const bytecode = contractJson.bytecode.object as `0x${string}`;
  const abi = contractJson.abi;

  // Encode deployment data
  const deployData = encodeDeployData({
    abi,
    bytecode,
    args: [USDC_ADDRESS],
  });

  console.log("   Constructor arg (USDC):", USDC_ADDRESS);
  console.log("\n🔨 Deploying contract...");

  // Send deployment transaction using CDP
  const txResult = await cdp.evm.sendTransaction({
    address: account.address,
    network: "base",
    transaction: {
      data: deployData,
    },
  });

  console.log("   Transaction hash:", txResult.transactionHash);
  console.log("   Waiting for confirmation...");

  // Wait for receipt
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txResult.transactionHash as `0x${string}`,
  });

  console.log("\n✅ FlashCargo deployed!");
  console.log("   Contract address:", receipt.contractAddress);
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas used:", receipt.gasUsed.toString());

  // Update contracts.ts
  console.log("\n📝 Updating lib/contracts.ts...");
  const contractsPath = path.join(__dirname, "../lib/contracts.ts");
  let contractsContent = fs.readFileSync(contractsPath, "utf-8");
  contractsContent = contractsContent.replace(
    /flashCargo: ["'].*["']/,
    `flashCargo: "${receipt.contractAddress}"`
  );
  fs.writeFileSync(contractsPath, contractsContent);

  console.log("\n🎉 Deployment complete!");
  console.log("   View on BaseScan: https://basescan.org/address/" + receipt.contractAddress);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
