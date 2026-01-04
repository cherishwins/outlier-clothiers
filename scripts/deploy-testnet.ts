import { CdpClient } from "@coinbase/cdp-sdk";
import { createPublicClient, http, encodeDeployData, formatEther, serializeTransaction } from "viem";
import { baseSepolia } from "viem/chains";
import * as fs from "fs";
import * as path from "path";

// Base Sepolia USDC (testnet)
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  console.log("🚀 Deploying to Base Sepolia (testnet)...\n");

  const cdp = new CdpClient();

  // Get or create testnet account
  const account = await cdp.evm.createAccount({ name: "outlier-deploy-v5" });
  console.log("📍 Wallet:", account.address);

  // Request faucet
  console.log("💧 Getting testnet ETH from faucet...");
  await cdp.evm.requestFaucet({
    address: account.address,
    network: "base-sepolia",
    token: "eth"
  });

  // Wait for faucet tx
  console.log("   Waiting for faucet confirmation...");
  await new Promise(r => setTimeout(r, 8000));

  // Check balance
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  let balance = await publicClient.getBalance({ address: account.address as `0x${string}` });
  console.log("💰 Balance:", formatEther(balance), "ETH");

  // Wait more if needed
  let attempts = 0;
  while (balance < 10000000000000n && attempts < 10) {
    console.log("   Waiting for faucet...");
    await new Promise(r => setTimeout(r, 3000));
    balance = await publicClient.getBalance({ address: account.address as `0x${string}` });
    attempts++;
  }
  console.log("💰 Final balance:", formatEther(balance), "ETH");

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

  // Encode deployment data with constructor args
  const deployData = encodeDeployData({
    abi,
    bytecode,
    args: [USDC_ADDRESS],
  });

  console.log("   Contract bytecode size:", deployData.length, "bytes");
  console.log("   Constructor arg (USDC):", USDC_ADDRESS);

  // Get gas estimates and nonce
  const [gasEstimate, nonce, feeData] = await Promise.all([
    publicClient.estimateGas({
      data: deployData,
      account: account.address as `0x${string}`,
    }),
    publicClient.getTransactionCount({ address: account.address as `0x${string}` }),
    publicClient.estimateFeesPerGas(),
  ]);

  console.log("   Gas estimate:", gasEstimate.toString());
  console.log("   Nonce:", nonce);

  console.log("\n🔨 Deploying contract...");

  // Serialize the transaction manually for contract creation
  // For contract creation, `to` is omitted entirely (not null, not undefined - just not present)
  const serializedTx = serializeTransaction({
    chainId: baseSepolia.id,
    type: "eip1559",
    nonce,
    gas: gasEstimate + 100000n,
    maxFeePerGas: feeData.maxFeePerGas! * 2n,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas! * 2n,
    value: 0n,
    data: deployData,
    // Note: no 'to' field for contract creation
  });

  console.log("   Serialized tx length:", serializedTx.length);

  // Send the pre-serialized transaction
  const txResult = await cdp.evm.sendTransaction({
    address: account.address,
    network: "base-sepolia",
    transaction: serializedTx,
  });

  console.log("   Transaction hash:", txResult.transactionHash);
  console.log("   Waiting for confirmation...");

  // Wait for receipt
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txResult.transactionHash as `0x${string}`,
  });

  console.log("\n✅ FlashCargo deployed to TESTNET!");
  console.log("   Contract address:", receipt.contractAddress);
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas used:", receipt.gasUsed.toString());
  console.log("\n   View: https://sepolia.basescan.org/address/" + receipt.contractAddress);

  return receipt.contractAddress;
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  console.error(err);
  process.exit(1);
});
