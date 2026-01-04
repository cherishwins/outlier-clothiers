import { LegacyCdpWalletProvider, legacyCdpWalletActionProvider } from "@coinbase/agentkit";
import * as fs from "fs";
import * as path from "path";

// Base Sepolia USDC (testnet)
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  console.log("🚀 Deploying to Base Sepolia using AgentKit Legacy...\n");

  // Create wallet provider
  const walletProvider = await LegacyCdpWalletProvider.configureWithWallet({
    networkId: "base-sepolia",
  });

  console.log("📍 Wallet:", walletProvider.getAddress());

  // Get faucet funds
  console.log("💧 Requesting testnet ETH...");
  const actionProvider = legacyCdpWalletActionProvider();

  // Read the contract source
  const contractSource = fs.readFileSync(
    path.join(__dirname, "../contracts/src/FlashCargo.sol"),
    "utf-8"
  );

  // Also need OpenZeppelin imports - let's use the compiled JSON instead
  const contractJson = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../contracts/out/FlashCargo.sol/FlashCargo.json"),
      "utf-8"
    )
  );

  console.log("\n📄 Deploying FlashCargo...");
  console.log("   This uses CDP's built-in Solidity compiler");

  // Deploy using action provider
  const result = await actionProvider.deployContract(walletProvider, {
    solidityVersion: "0.8.28",
    solidityInputJson: JSON.stringify({
      language: "Solidity",
      sources: {
        "FlashCargo.sol": { content: contractSource }
      },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: {
          "*": { "*": ["abi", "evm.bytecode"] }
        }
      }
    }),
    contractName: "FlashCargo",
    constructorArgs: { "_usdc": USDC_ADDRESS }
  });

  console.log("\n✅ Result:", result);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
