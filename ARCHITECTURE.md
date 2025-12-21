# OUTLIER CLOTHIERS - Complete System Architecture

## Table of Contents
1. [Payment Flow Architecture](#payment-flow-architecture)
2. [Shipping Integration](#shipping-integration)
3. [Database Schema](#database-schema)
4. [Order Fulfillment Pipeline](#order-fulfillment-pipeline)
5. [Smart Contract Integration](#smart-contract-integration)
6. [Security & Compliance](#security--compliance)

---

## Payment Flow Architecture

### How Customer Payments Work

```
Customer clicks "Buy Now"
    ↓
Payment Modal opens with 3 options:
    ↓
[Option 1: Coinbase Commerce]
    → Customer pays with credit card
    → Coinbase converts to crypto
    → Webhook fires to /api/webhooks/coinbase
    → Funds deposited to smart contract
    → Order record created in database
    → Customer gets NFT receipt token
    
[Option 2: x402 Protocol]
    → Customer's wallet prompted to pay USDC
    → x402 middleware detects payment on-chain
    → Webhook fires to /api/webhooks/x402
    → Funds deposited to smart contract
    → Order record created in database
    → Customer gets NFT receipt token
    
[Option 3: Telegram Stars/TON]
    → Customer pays in Telegram app
    → Telegram webhook fires to /api/webhooks/telegram
    → Funds converted and deposited to contract
    → Order record created in database
    → Customer gets NFT receipt token
```

### Smart Contract Escrow Flow

```
Funds arrive in DropEscrow contract
    ↓
Contract checks: Is drop fully funded?
    ↓
YES → Release 90% to facilitator wallet for pallet purchase
    → Hold 10% in escrow until delivery
    ↓
Facilitator buys pallet from ViaTrading/B-Stock
    ↓
Facilitator ships orders (tracking uploaded to database)
    ↓
Customer confirms delivery in app
    ↓
Smart contract releases final 10% + burns NFT receipt
    ↓
NO → Funds held in escrow until deadline
    → If deadline passes without funding → Auto-refund all customers
```

### Key Point: YOU NEVER HOLD MONEY

- Customer funds go DIRECTLY to smart contract
- Smart contract releases funds based on milestones
- You're a facilitator, not a custodian
- Zero custody risk

---

## Shipping Integration

### Provider: EasyPost (Recommended)

**Why EasyPost:**
- Compares rates from USPS, UPS, FedEx, DHL
- Automatic label generation
- Real-time tracking
- Insurance built-in
- API-first design

### Shipping Cost Calculation

```typescript
// app/api/shipping/calculate/route.ts
import Easypost from '@easypost/api'

const client = new Easypost(process.env.EASYPOST_API_KEY)

export async function POST(request) {
  const { to_address, weight_oz } = await request.json()
  
  // Calculate shipping cost
  const shipment = await client.Shipment.create({
    from_address: {
      street1: "YOUR_WAREHOUSE_ADDRESS",
      city: "Toronto",
      state: "ON",
      zip: "M5H2N2",
      country: "CA"
    },
    to_address,
    parcel: {
      weight: weight_oz // Mystery box weight
    }
  })
  
  // Return cheapest rate
  const rates = shipment.rates.sort((a, b) => a.rate - b.rate)
  return { 
    shipping_cost: rates[0].rate,
    estimated_days: rates[0].delivery_days 
  }
}
```

### Shipping Cost Included in Box Price

```typescript
// Calculate total box price
const MYSTERY_BOX_BASE_PRICE = 35 // Your profit margin
const PALLET_COST_PER_BOX = (palletCost / numberOfBoxes)
const AVERAGE_SHIPPING_COST = 12 // Pre-calculated average

const FINAL_BOX_PRICE = MYSTERY_BOX_BASE_PRICE + PALLET_COST_PER_BOX + AVERAGE_SHIPPING_COST
```

**Customer sees:** `1200 Stars ($12 USD)` — all-inclusive

### Label Generation & Tracking

```typescript
// app/api/shipping/create-label/route.ts
export async function POST(request) {
  const { order_id, to_address } = await request.json()
  
  // Buy shipping label
  const shipment = await client.Shipment.create({...})
  await shipment.buy(shipment.lowestRate())
  
  // Save tracking to database
  await db.order.update({
    where: { id: order_id },
    data: {
      tracking_number: shipment.tracking_code,
      shipping_label_url: shipment.postage_label.label_url,
      carrier: shipment.selected_rate.carrier
    }
  })
  
  return { 
    tracking_number: shipment.tracking_code,
    label_url: shipment.postage_label.label_url 
  }
}
```

### Customer Delivery Confirmation

**Option 1: Automatic (Recommended)**
```typescript
// app/api/webhooks/easypost/route.ts
export async function POST(request) {
  const event = await request.json()
  
  if (event.description === "tracker.updated" && event.result.status === "delivered") {
    // Mark order as delivered in database
    await db.order.update({
      where: { tracking_number: event.result.tracking_code },
      data: { status: "delivered", delivered_at: new Date() }
    })
    
    // Trigger smart contract to release final 10%
    await releaseEscrowFunds(order.receipt_nft_id)
  }
}
```

**Option 2: Manual Confirmation**
```typescript
// Customer clicks "Confirm Delivery" in app
await db.order.update({
  where: { id: order_id },
  data: { 
    status: "delivered", 
    customer_confirmed: true,
    delivered_at: new Date() 
  }
})

// Smart contract releases final payment
await contract.confirmDelivery(receipt_nft_id)
```

---

## Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Drop {
  id                String   @id @default(cuid())
  name              String
  source            String   // "ViaTrading", "B-Stock", etc.
  source_url        String?
  pallet_cost       Float
  box_price         Float
  boxes_needed      Int
  boxes_sold        Int      @default(0)
  funding_deadline  DateTime
  status            String   @default("funding") // funding, funded, shipped, completed
  manifest          Json     // Array of items
  images            String[]
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  orders            Order[]
  contract_address  String?  // Smart contract escrow address
}

model Order {
  id                String   @id @default(cuid())
  drop_id           String
  drop              Drop     @relation(fields: [drop_id], references: [id])
  
  customer_wallet   String   // Crypto wallet or Telegram user ID
  customer_email    String?
  customer_name     String?
  
  // Shipping
  shipping_address  Json     // Full address object
  shipping_cost     Float
  tracking_number   String?
  shipping_label_url String?
  carrier           String?
  
  // Payment
  payment_method    String   // "coinbase", "x402", "telegram"
  payment_amount    Float
  payment_currency  String
  payment_tx_hash   String?  // Blockchain transaction
  
  // NFT Receipt
  receipt_nft_id    String?  // ERC721 token ID
  receipt_nft_tx    String?  // Mint transaction
  
  // Status
  status            String   @default("pending") // pending, paid, shipped, delivered, refunded
  paid_at           DateTime?
  shipped_at        DateTime?
  delivered_at      DateTime?
  customer_confirmed Boolean @default(false)
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  @@index([drop_id])
  @@index([customer_wallet])
  @@index([tracking_number])
}

model Pallet {
  id                String   @id @default(cuid())
  viatrading_id     String?  // External ID from ViaTrading
  name              String
  source            String
  source_url        String
  cost              Float
  manifest          Json
  condition_grade   String   // A, B, C, D
  units             Int
  retail_value_min  Float
  retail_value_max  Float
  photos            String[]
  inspection_video  String?
  
  status            String   @default("listed") // listed, funded, purchased, received
  purchased_at      DateTime?
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
}

model User {
  id                String   @id @default(cuid())
  wallet_address    String   @unique
  telegram_id       String?  @unique
  email             String?
  
  membership_tier   String   @default("public") // public, gang, legend
  referral_code     String   @unique
  referred_by       String?
  
  total_orders      Int      @default(0)
  total_spent       Float    @default(0)
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  @@index([referral_code])
}
```

---

## Order Fulfillment Pipeline

### Admin Dashboard Flow

```
1. Customer orders mystery box
   → Order record created with status: "pending"
   → Payment processes → Status: "paid"

2. Facilitator sees order in dashboard
   → GET /api/admin/orders?drop_id={id}&status=paid

3. Drop reaches funding goal
   → Smart contract releases 90% to facilitator
   → Facilitator goes to ViaTrading and buys pallet

4. Pallet arrives at warehouse
   → Facilitator inspects goods
   → Takes photos/videos for transparency

5. Fulfillment process
   → Facilitator packs random mystery boxes
   → Prints shipping labels via EasyPost
   → Updates order status: "shipped"
   → Tracking numbers auto-emailed to customers

6. Customer receives box
   → Tracking shows "delivered"
   → Customer confirms in app
   → Smart contract releases final 10%

7. Order complete
   → NFT receipt burned
   → Customer can leave review
```

### Bulk Operations for Facilitators

```typescript
// Generate all shipping labels at once
POST /api/admin/bulk-ship
{
  "drop_id": "...",
  "orders": ["order_1", "order_2", ...],
  "ship_date": "2025-01-15"
}

// Response: Array of label PDFs
[
  { order_id: "order_1", label_url: "...", tracking: "..." },
  { order_id: "order_2", label_url: "...", tracking: "..." }
]
```

---

## Smart Contract Integration

### Payment → Contract Flow

```typescript
// lib/smart-contract.ts
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { base } from 'viem/chains'
import DropEscrowABI from './abis/DropEscrow.json'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS

// When payment received, fund the drop
export async function fundDrop(dropId: number, quantity: number, boxPrice: string) {
  const walletClient = createWalletClient({
    chain: base,
    transport: http()
  })
  
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: DropEscrowABI,
    functionName: 'fundDrop',
    args: [BigInt(dropId), BigInt(quantity)],
    value: parseEther((parseFloat(boxPrice) * quantity).toString())
  })
  
  return hash
}

// Check if drop is fully funded
export async function checkDropStatus(dropId: number) {
  const publicClient = createPublicClient({
    chain: base,
    transport: http()
  })
  
  const drop = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: DropEscrowABI,
    functionName: 'drops',
    args: [BigInt(dropId)]
  })
  
  return {
    funded: drop.funded,
    released: drop.released,
    totalRaised: drop.totalRaised
  }
}
```

### Webhook Integration

```typescript
// app/api/webhooks/coinbase/route.ts
export async function POST(request: Request) {
  const event = await request.json()
  
  if (event.type === 'charge:confirmed') {
    const charge_id = event.data.id
    const metadata = event.data.metadata
    
    // Create order in database
    const order = await db.order.create({
      data: {
        drop_id: metadata.drop_id,
        customer_email: event.data.customer_email,
        payment_method: "coinbase",
        payment_amount: event.data.pricing.local.amount,
        payment_currency: event.data.pricing.local.currency,
        payment_tx_hash: event.data.timeline.find(t => t.status === 'COMPLETED')?.payment?.transaction_id,
        status: "paid",
        paid_at: new Date()
      }
    })
    
    // Fund smart contract
    await fundDrop(metadata.drop_id, 1, metadata.box_price)
    
    // Mint NFT receipt
    const nft_id = await mintReceiptNFT(order.id)
    await db.order.update({
      where: { id: order.id },
      data: { receipt_nft_id: nft_id }
    })
  }
  
  return new Response('OK')
}
```

---

## Security & Compliance

### Payment Security
- ✅ All payments processed via regulated providers (Coinbase, Telegram)
- ✅ No customer payment info stored (handled by providers)
- ✅ Smart contract audited before mainnet
- ✅ Multi-sig wallet for contract admin functions

### Shipping & Privacy
- ✅ Addresses encrypted at rest (use `@prisma/client` field-level encryption)
- ✅ Shipping labels printed on-demand (not stored long-term)
- ✅ Customer data deleted 90 days post-delivery (GDPR compliant)

### Refund Policy
- ✅ Automatic refunds if drop doesn't reach funding goal
- ✅ Refunds processed via smart contract (no manual intervention)
- ✅ 7-day dispute window for damaged items

### Compliance Checklist
- [ ] Import/export licenses for cross-border shipping
- [ ] Sales tax collection (use TaxJar API)
- [ ] Consumer protection disclosures
- [ ] Terms of service + Privacy policy
- [ ] DMCA agent registration (if selling branded goods)

---

## Tech Stack Summary

### Frontend
- Next.js 16 (App Router)
- React 19
- TailwindCSS v4
- Radix UI

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL (via Supabase or Neon)
- Redis (for rate limiting)

### Payment
- Coinbase Commerce
- x402 Protocol
- Telegram Stars/TON

### Shipping
- EasyPost API
- Webhook tracking

### Blockchain
- Base L2 (low fees)
- Viem + Wagmi
- Smart Contract: DropEscrow.sol

### Monitoring
- Sentry (error tracking)
- PostHog (analytics)
- EasyPost webhooks (delivery tracking)

---

**This architecture ensures you're a trustless facilitator with zero custody risk, automated fulfillment, and transparent operations.**
