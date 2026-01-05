import { createWalletClient, createPublicClient, http, parseEther, formatEther } from "viem";
import { mainnet, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Deployer wallet with ETH on Ethereum mainnet
const PRIVATE_KEY = process.env.BRIDGE_PRIVATE_KEY as `0x${string}` | undefined;

// Base Bridge contract on Ethereum mainnet
const BASE_BRIDGE = "0x49048044D57e1C92A77f79988d21Fa8fAF74E97e";

async function main() {
  console.log("🔍 Checking Ethereum mainnet balance...\n");

  if (!PRIVATE_KEY) {
    throw new Error("Missing BRIDGE_PRIVATE_KEY (0x...) in environment");
  }

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log("Wallet:", account.address);

  // Create clients
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http("https://ethereum.publicnode.com"),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("\n❌ No ETH found. Transaction might still be propagating.");
    console.log("   Check: https://etherscan.io/address/" + account.address);
    return;
  }

  console.log("\n🌉 Bridging to Base...");

  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http("https://ethereum.publicnode.com"),
  });

  // Estimate gas for bridge
  const gasEstimate = await publicClient.estimateGas({
    account: account.address,
    to: BASE_BRIDGE,
    value: balance - parseEther("0.001"), // Leave some for gas
  });

  console.log("Gas estimate:", gasEstimate.toString());

  const gasPrice = await publicClient.getGasPrice();
  const gasCost = gasEstimate * gasPrice;
  console.log("Estimated gas cost:", formatEther(gasCost), "ETH");

  const bridgeAmount = balance - gasCost - parseEther("0.0001"); // Extra buffer
  console.log("Amount to bridge:", formatEther(bridgeAmount), "ETH");

  if (bridgeAmount <= 0n) {
    console.log("\n❌ Not enough ETH to cover gas for bridge.");
    return;
  }

  // Send to Base bridge
  const hash = await walletClient.sendTransaction({
    to: BASE_BRIDGE,
    value: bridgeAmount,
    gas: gasEstimate,
  });

  console.log("\n✅ Bridge transaction sent!");
  console.log("   Hash:", hash);
  console.log("   View: https://etherscan.io/tx/" + hash);
  console.log("\n   ETH will arrive on Base in ~1-2 minutes");
}

main().catch((err) => {
  console.error("Error:", err.message);
});
