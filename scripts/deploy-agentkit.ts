import { CdpEvmWalletProvider } from "@coinbase/agentkit";
import { encodeDeployData, formatEther } from "viem";
import * as fs from "fs";
import * as path from "path";

// Base mainnet USDC
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

async function deploy() {
  console.log("🚀 Initializing CDP Wallet on Base mainnet...\n");

  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  if (!apiKeyId || !apiKeySecret) {
    throw new Error("Missing CDP_API_KEY_ID / CDP_API_KEY_SECRET in environment");
  }

  const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyId,
    apiKeySecret,
    networkId: "base",
  });

  const walletAddress = walletProvider.getAddress();
  console.log("📍 Wallet address:", walletAddress);

  // Get balance
  const balance = await walletProvider.getBalance();
  console.log("💰 Balance:", formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("\n⚠️  Wallet needs ETH for gas!");
    console.log("Send ETH on Base network to:", walletAddress);
    return;
  }

  // Read compiled contract
  const contractJson = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../contracts/out/FlashCargo.sol/FlashCargo.json"),
      "utf-8"
    )
  );

  const bytecode = contractJson.bytecode.object as `0x${string}`;
  const abi = contractJson.abi;

  console.log("\n📄 Deploying FlashCargo contract...");
  console.log("   Constructor arg (USDC):", USDC_ADDRESS);

  // Encode deployment data
  const deployData = encodeDeployData({
    abi,
    bytecode,
    args: [USDC_ADDRESS],
  });

  // Send deployment transaction
  const txHash = await walletProvider.sendTransaction({
    data: deployData,
  });

  console.log("\n⏳ Transaction sent:", txHash);
  console.log("   Waiting for confirmation...");

  // Wait for receipt
  const receipt = await walletProvider.waitForTransactionReceipt(txHash);

  console.log("\n✅ FlashCargo deployed!");
  console.log("   Contract address:", receipt.contractAddress);
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas used:", receipt.gasUsed.toString());

  console.log("\n📝 Update lib/contracts.ts with this address:");
  console.log(`   flashCargo: "${receipt.contractAddress}"`);

  return receipt.contractAddress;
}

deploy()
  .then((address) => {
    console.log("\n🎉 Deployment complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Deployment failed:", err.message);
    process.exit(1);
  });
