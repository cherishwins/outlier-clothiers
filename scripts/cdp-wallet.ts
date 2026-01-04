import { CdpClient } from "@coinbase/cdp-sdk";
import * as fs from "fs";
import * as path from "path";

// Load CDP API key
const CDP_API_KEY = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../cdp_api_key (1).json"), "utf-8")
);

async function main() {
  console.log("Initializing CDP Client...\n");

  try {
    // Try without wallet secret first - maybe server wallets don't need it
    const cdp = new CdpClient({
      apiKeyId: CDP_API_KEY.id,
      apiKeySecret: CDP_API_KEY.privateKey,
    });

    console.log("CDP Client initialized!");

    // Try to create or get an EVM account on Base
    console.log("\nCreating EVM account on Base...");
    const account = await cdp.evm.createAccount({
      name: "outlier-deployer"
    });

    console.log("Account created!");
    console.log("Address:", account.address);

    // Check balance
    const balance = await cdp.evm.getBalance({
      address: account.address,
      network: "base"
    });

    console.log("Balance:", balance);

  } catch (error: any) {
    console.error("Error:", error.message);

    // If it needs wallet secret, show that
    if (error.message.includes("wallet") || error.message.includes("secret")) {
      console.log("\nNeed to create Wallet Secret in CDP Portal.");
      console.log("Go to: https://portal.cdp.coinbase.com");
      console.log("Look for 'Wallets' or 'Wallet Secret' section");
    }
  }
}

main();
