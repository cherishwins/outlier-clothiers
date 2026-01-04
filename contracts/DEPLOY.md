# FlashCargo Contract Deployment

## Deployer Wallet (Testnet Only)
```
Address: 0xa58740136d8880d74cb5426B988d297273AC579e
Private Key: 0x66f8138861f13ea6de810493c004e71957b1d7442d3be5aaab197ae2b58854c6
```

## Step 1: Get Testnet ETH

Get ~0.01 ETH from the Base Sepolia faucet:
https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

Paste address: `0xa58740136d8880d74cb5426B988d297273AC579e`

## Step 2: Deploy Contract

```bash
cd contracts

# Deploy to Base Sepolia
~/.foundry/bin/forge create \
  --rpc-url https://sepolia.base.org \
  --private-key 0x66f8138861f13ea6de810493c004e71957b1d7442d3be5aaab197ae2b58854c6 \
  src/FlashCargo.sol:FlashCargo \
  --constructor-args 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

## Step 3: Update Contract Address

After deployment, copy the deployed contract address and update:
- `lib/contracts.ts` - Set `CONTRACTS.baseSepolia.flashCargo`

## Step 4: Verify Contract (Optional)

```bash
~/.foundry/bin/forge verify-contract \
  --chain-id 84532 \
  --compiler-version v0.8.28 \
  <DEPLOYED_ADDRESS> \
  src/FlashCargo.sol:FlashCargo \
  --constructor-args $(cast abi-encode "constructor(address)" 0x036CbD53842c5426634e7929541eC2318f3dCF7e)
```

## Contract Details

- **Name**: Outlier Clothiers Receipt (OCR)
- **Type**: ERC721 + Escrow
- **USDC (Base Sepolia)**: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
- **Features**:
  - Tiered pricing (first 500 slots base, next 300 +30%, rest +60%)
  - NFT receipts for purchases
  - Auto-refund if funding target not met
  - Owner can release funds when target reached
