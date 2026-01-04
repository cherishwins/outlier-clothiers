import { LegacyCdpWalletProvider } from "@coinbase/agentkit";
import * as fs from "fs";
import * as path from "path";

// Base Sepolia USDC (testnet)
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  console.log("🚀 Deploying to Base Sepolia using Legacy Provider...\n");

  // Create wallet provider on testnet
  const walletProvider = await LegacyCdpWalletProvider.configureWithWallet({
    networkId: "base-sepolia",
  });

  console.log("📍 Wallet:", walletProvider.getAddress());

  // Read the contract source
  const contractSource = fs.readFileSync(
    path.join(__dirname, "../contracts/src/FlashCargo.sol"),
    "utf-8"
  );

  // Read OpenZeppelin dependencies
  const ozDir = path.join(__dirname, "../contracts/lib/openzeppelin-contracts/contracts");

  const sources: Record<string, { content: string }> = {
    "src/FlashCargo.sol": { content: contractSource },
  };

  // Add OpenZeppelin sources
  const addOzFile = (relativePath: string) => {
    const fullPath = path.join(ozDir, relativePath);
    if (fs.existsSync(fullPath)) {
      sources[`@openzeppelin/contracts/${relativePath}`] = {
        content: fs.readFileSync(fullPath, "utf-8")
      };
    }
  };

  // Core dependencies
  addOzFile("token/ERC20/IERC20.sol");
  addOzFile("token/ERC20/utils/SafeERC20.sol");
  addOzFile("token/ERC721/ERC721.sol");
  addOzFile("token/ERC721/IERC721.sol");
  addOzFile("token/ERC721/IERC721Receiver.sol");
  addOzFile("token/ERC721/extensions/IERC721Metadata.sol");
  addOzFile("access/Ownable.sol");
  addOzFile("utils/ReentrancyGuard.sol");
  addOzFile("utils/Context.sol");
  addOzFile("utils/introspection/ERC165.sol");
  addOzFile("utils/introspection/IERC165.sol");
  addOzFile("interfaces/IERC1363.sol");
  addOzFile("interfaces/IERC165.sol");
  addOzFile("interfaces/draft-IERC6093.sol");
  addOzFile("utils/Strings.sol");
  addOzFile("utils/math/Math.sol");
  addOzFile("utils/math/SafeCast.sol");
  addOzFile("utils/math/SignedMath.sol");
  addOzFile("interfaces/IERC721.sol");
  addOzFile("token/ERC20/extensions/IERC20Permit.sol");
  addOzFile("utils/Address.sol");
  addOzFile("interfaces/IERC20.sol");

  console.log("📄 Sources loaded:", Object.keys(sources).length, "files");

  const solidityInputJson = JSON.stringify({
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode"] }
      },
      remappings: [
        "@openzeppelin/contracts/=@openzeppelin/contracts/"
      ]
    }
  });

  console.log("\n🔨 Deploying FlashCargo...");
  console.log("   (CDP will compile and deploy)");

  try {
    // Use the wallet provider's deployContract method
    const contract = await (walletProvider as any).deployContract({
      solidityVersion: "0.8.28",
      solidityInputJson,
      contractName: "FlashCargo",
      constructorArgs: { "_usdc": USDC_ADDRESS },
    });

    console.log("   Waiting for deployment...");
    const result = await contract.wait();

    console.log("\n✅ FlashCargo deployed!");
    console.log("   Address:", result.getContractAddress());
    console.log("   Tx:", result.getTransaction().getTransactionLink());
  } catch (error: any) {
    console.error("\n❌ Deploy failed:", error.message);
    if (error.message.includes("solidity")) {
      console.log("\n   Solidity input might be malformed.");
    }
  }
}

main().catch(console.error);
