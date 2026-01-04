# OUTLIER CLOTHIERS

> **Crypto-Native Flash DAO for Luxury Liquidation**
>
> Pre-fund pallets. Get 80% off retail. Zero inventory risk.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cherishwins/outlier-clothiers)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](https://opensource.org/licenses/MIT)

**Live Site:** [outlierclothiers.com](https://outlierclothiers.com)

---

## The Model

We're flipping the liquidation game with trustless crowdfunding. Factories overproduce. Orders get canceled. We buy the surplus via manifested truckloads—you get designer goods at wholesale prices through a Flash DAO model.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FLASH DAO FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. SCOUT         2. FUND           3. BUY           4. SHIP        │
│  ┌──────┐        ┌──────┐         ┌──────┐        ┌──────┐         │
│  │Pallet│   →    │Escrow│    →    │Purchase│   →   │Fulfill│        │
│  │Listed│        │Smart │         │Pallet │        │Orders │        │
│  └──────┘        │Contract│       └──────┘        └──────┘         │
│                  └──────┘                                           │
│      ↓               ↓                ↓               ↓             │
│  Manifest       Tiered           Auto-release    NFT Receipt        │
│  Visible        Pricing          Funds           + Tracking         │
│                 (70%→130%)       @ Threshold                        │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│  MISS TARGET? → Auto-refund all buyers. Zero custody risk.         │
└─────────────────────────────────────────────────────────────────────┘
```

### Why This Works

| Traditional Model | Our Flash DAO |
|-------------------|---------------|
| Buy inventory first | Crowdfund first |
| Hold unsold stock | Zero inventory risk |
| 3-5% payment fees | Near-zero crypto fees |
| Chargebacks | Irreversible on-chain |
| Trust the seller | Trust the contract |

---

## Tech Stack

```
Frontend          Backend           Payments           Blockchain
─────────         ───────           ────────           ──────────
Next.js 16        API Routes        x402 Protocol      Base L2
React 19          Prisma ORM        Telegram Stars     Smart Contracts
TailwindCSS v4    PostgreSQL        TON                Viem + Wagmi
Radix UI          EasyPost API      Coinbase Commerce  NFT Receipts
```

### Key Dependencies

- **[viem](https://viem.sh)** + **[wagmi](https://wagmi.sh)** - Blockchain interactions
- **[Prisma](https://prisma.io)** - Type-safe database ORM
- **[@tanstack/react-query](https://tanstack.com/query)** - Server state management
- **[zod](https://zod.dev)** - Runtime validation
- **[lucide-react](https://lucide.dev)** - Icons

---

## Payment Architecture

We support three payment rails for maximum accessibility:

### 1. x402 Protocol (Crypto Native)

HTTP 402 Payment Required standard. One-click USDC payments on Base L2.

```typescript
// app/api/payment/x402/route.ts
export async function POST(request: NextRequest) {
  const { amount } = await request.json()

  return NextResponse.json({
    amount,
    currency: "USDC",
    address: process.env.X402_PAYMENT_ADDRESS,
    network: "base",
  }, { status: 402 }) // HTTP 402 Payment Required
}
```

**Supported Wallets:** Coinbase Wallet, Rainbow, MetaMask (with x402 Snap), Phantom

### 2. Telegram Stars/TON (Native)

Pay directly in Telegram. Integrated with Telegram WebApp API.

```typescript
// Telegram Stars integration
const invoice = await bot.createInvoice({
  title: "Mystery Box",
  description: "80% off retail luxury goods",
  currency: "XTR", // Telegram Stars
  prices: [{ amount: 1200, label: "Mystery Box" }]
})
```

### 3. Coinbase Commerce (Fiat On-ramp)

Credit/debit cards accepted. Automatic crypto conversion.

---

## Project Structure

```
outlier-clothiers/
├── app/
│   ├── api/
│   │   ├── payment/
│   │   │   ├── coinbase/route.ts    # Coinbase Commerce
│   │   │   ├── telegram/route.ts    # Stars/TON
│   │   │   └── x402/route.ts        # x402 Protocol
│   │   └── shipping/
│   │       ├── calculate/route.ts   # EasyPost rates
│   │       └── create-label/route.ts
│   ├── admin/page.tsx               # Order management
│   ├── drops/page.tsx               # Mystery box drops
│   ├── juche/page.tsx               # VIP network (Juche Gang)
│   ├── memeseal/page.tsx            # TON notary service
│   ├── pallets/page.tsx             # Active pallet funding
│   ├── tactical/page.tsx            # Tactical gear section
│   ├── layout.tsx
│   └── page.tsx                     # Landing page
├── components/
│   ├── admin/                       # Dashboard components
│   ├── drops/                       # Drop-specific UI
│   ├── juche/                       # VIP membership UI
│   ├── memeseal/                    # TON notary UI
│   ├── pallets/                     # Pallet funding UI
│   ├── payment/                     # Payment modal
│   ├── tactical/                    # Tactical gear UI
│   └── ui/                          # Shadcn/Radix primitives
├── lib/
│   └── utils.ts                     # Utility functions
├── prisma/
│   └── schema.prisma                # Database schema
├── public/
│   └── images/                      # Static assets
├── styles/
│   └── globals.css                  # Global styles
├── .env.example                     # Environment template
└── package.json
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm/npm
- PostgreSQL (or Supabase/Neon)

### Installation

```bash
# Clone the repository
git clone https://github.com/cherishwins/outlier-clothiers.git
cd outlier-clothiers

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Payment APIs
COINBASE_COMMERCE_API_KEY=
X402_PAYMENT_ADDRESS=0x...
TELEGRAM_BOT_TOKEN=

# Shipping (optional)
EASYPOST_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Schema

Core models for the Flash DAO:

```prisma
model Drop {
  id               String   @id @default(cuid())
  name             String
  source           String   // "ViaTrading", "B-Stock"
  pallet_cost      Float
  box_price        Float
  boxes_needed     Int
  boxes_sold       Int      @default(0)
  funding_deadline DateTime
  status           String   @default("funding")
  manifest         Json     // Full UPC manifest
  contract_address String?  // Escrow contract
  orders           Order[]
}

model Order {
  id               String   @id @default(cuid())
  customer_wallet  String
  payment_method   String   // "x402", "telegram", "coinbase"
  payment_amount   Float
  receipt_nft_id   String?  // On-chain receipt
  status           String   @default("pending")
  tracking_number  String?
}
```

---

## Smart Contract (Escrow)

The Flash DAO uses an on-chain escrow contract on Base L2:

```solidity
// contracts/FlashCargo.sol
contract FlashCargo is ERC721, ReentrancyGuard {
    uint256 public totalNeeded = 40_000 * 1e6; // 40k USDC
    uint256 public raised = 0;
    uint256 public deadline;

    function buySlot() external nonReentrant {
        // Tiered pricing: first 500 @ 70 USDC, next 300 @ 100, last 200 @ 130
        uint256 price = getPrice();
        require(usdc.transferFrom(msg.sender, address(this), price));
        _safeMint(msg.sender, tokenCounter++);
        raised += price;
    }

    function releaseFunds() external {
        require(raised >= totalNeeded, "Not funded");
        usdc.transfer(treasury, raised);
    }

    function refund() external {
        require(block.timestamp > deadline && raised < totalNeeded);
        // Auto-refund logic
    }
}
```

---

## Sourcing Strategy

### Liquidation Suppliers

| Supplier | Type | API Access |
|----------|------|------------|
| [B-Stock](https://bstock.com) | Auctions | Private API (approved buyers) |
| [Direct Liquidation](https://directliquidation.com) | Fixed-price | Bulk feeds available |
| [ViaTrading](https://viatrading.com) | Truckloads | Manual manifests |
| [Select Liquidation](https://selectliquidation.com) | Direct | Phone + hold |

### Partnership Pitch Template

```
Subject: Partnership – sell your truckloads 10× faster with on-chain flash sales

We take your manifest CSV → auto-list every UPC as a tiered slot
Buyers pay USDC to escrow contract (no custody risk)
Hit target → funds auto-release to you, we ship
Miss target → 100% auto-refunds, zero work for you

Live demo: [your-demo-url]
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add COINBASE_COMMERCE_API_KEY
vercel env add X402_PAYMENT_ADDRESS
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production
npm run lint         # ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/flash-dao-v2`)
3. Commit changes (`git commit -m 'Add NFT receipt minting'`)
4. Push to branch (`git push origin feature/flash-dao-v2`)
5. Open Pull Request

---

## Legal & Compliance

- **Canada:** Crypto payments treated as barter income. Track fair market value.
- **No MSB license required** for crypto-only operations (no fiat ramps)
- Auto-refunds via smart contract = no custody risk
- Consult tax professional for CARF reporting (2026+)

---

## Links

- **Website:** [outlierclothiers.com](https://outlierclothiers.com)
- **Telegram:** [@JucheGang](https://t.me/JucheGang)
- **GitHub:** [cherishwins/outlier-clothiers](https://github.com/cherishwins/outlier-clothiers)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built by **JUCHE GANG**. Self-reliant. Future-focused.

```
       _____
      /     \
     /  O O  \
    |    ^    |      "The panda sees both
    |  \___/  |       black and white clearly."
     \_______/
```
