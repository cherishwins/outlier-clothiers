# Outlier Clothiers - Claude Code Instructions

## Project Overview

**Outlier Clothiers** is a crypto-native Flash DAO for luxury liquidation.

- **Domain:** outlierclothiers.com
- **Stack:** Next.js 16, React 19, TailwindCSS v4, Prisma, Base L2
- **Payment:** x402 Protocol, Telegram Stars, TON, Coinbase Commerce
- **Model:** Pre-fund pallets → Escrow → Ship or Refund

## Quick Context

```
┌─────────────────────────────────────────────────────────────┐
│  FLASH DAO: Crowdfund → Buy Pallet → Ship Mystery Boxes    │
│  Zero inventory risk. 80% off retail. Smart contract escrow│
└─────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Landing page with hero |
| `app/drops/page.tsx` | Mystery box drops |
| `app/pallets/page.tsx` | Active pallet funding |
| `app/juche/page.tsx` | VIP membership (Juche Gang) |
| `app/api/payment/x402/route.ts` | x402 payment endpoint |
| `prisma/schema.prisma` | Database models |
| `ARCHITECTURE.md` | Full system design |
| `BUSINESS_PLAN.md` | Revenue model |

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB
npm run db:studio    # Open Prisma Studio
```

## Code Conventions

- **Server Components by default** - only use `'use client'` when needed
- **TailwindCSS v4** - use `cn()` for conditional classes
- **Radix UI** - primitives in `components/ui/`
- **Named exports** - prefer over default exports
- **TypeScript interfaces** - not types or enums

## Payment Integration Patterns

### x402 Protocol (HTTP 402)
```typescript
return NextResponse.json({
  amount: 49.99,
  currency: "USDC",
  address: process.env.X402_PAYMENT_ADDRESS,
  network: "base",
}, { status: 402 })
```

### Smart Contract Escrow
- Buyers pay → funds locked in contract
- Threshold met → release to facilitator
- Threshold missed → auto-refund all

## Design System

- **Primary:** `#D4AF37` (Gold)
- **Background:** `#0a0a0a` (Near-black)
- **Style:** Luxury minimalist with gold accents

## DO NOT

- Hardcode wallet addresses (use env vars)
- Skip error handling in payment flows
- Create redundant UI components
- Deploy contracts to mainnet without testnet testing

## Sourcing Context

We buy liquidation pallets from:
- B-Stock (Amazon/Walmart auctions)
- Direct Liquidation (Walmart fixed-price)
- ViaTrading (manifested truckloads)

Customers pre-fund via crypto → we buy once threshold hit → ship mystery boxes.

---

Built by JUCHE GANG. Self-reliant. Future-focused.
