# FlashCargo Contract Deployment

## Deployment

Using CDP SDK with secure wallet management. See `scripts/deploy-cdp.ts`.

CDP Wallet: `0xd9dD6AF0ceE2ddD9f36B29528C0222b21E8Cde73` (Base mainnet)

```bash
# Deploy to Base mainnet
npm run deploy:cdp
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
