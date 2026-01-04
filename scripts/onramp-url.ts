// Generate Coinbase Onramp URL
const CDP_WALLET = "0xd9dD6AF0ceE2ddD9f36B29528C0222b21E8Cde73";

// Simple direct link to Coinbase Pay
const onrampUrl = `https://pay.coinbase.com/buy/select-asset?` + new URLSearchParams({
  appId: "outlier-clothiers",
  destinationWallets: JSON.stringify([{
    address: CDP_WALLET,
    blockchains: ["base"],
    assets: ["ETH"]
  }]),
  defaultAsset: "ETH",
  defaultNetwork: "base",
  presetFiatAmount: "15"
}).toString();

console.log("🔗 Coinbase Onramp URL:\n");
console.log(onrampUrl);
console.log("\n📍 Destination: " + CDP_WALLET + " on Base");
