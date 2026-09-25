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

Spec-correct, via `x402-merchant` (from `cherishwins/x402-facilitator`,
vendored as `vendor/x402-merchant-0.1.0.tgz` until it is on npm).

```
GET  /api/payment/x402?dropId=1&quantity=2   402: slot price from the contract, v1 body + v2 PAYMENT-REQUIRED header
POST /api/payment/x402?dropId=1&quantity=2   X-PAYMENT header: verified offline, nonce claimed (X402Payment.nonce UNIQUE),
                                             collected by the CDP server wallet, then settleOrder() buys the escrow slot
```

- `lib/x402.ts` is the whole rail: quote, claim, settle. The modal's x402
  branch uses `x402-merchant/client` with wagmi to sign; the buyer pays no
  gas and sends no transaction.
- `X402_PAYMENT_ADDRESS` is where the USDC lands. Set it to the CDP server
  wallet's address so the same wallet that receives can fund `buySlot`.
- Nothing the client says about money is trusted: amount from
  `quoteDrop()` at the time of the call, recipient from env, and the
  signature must match both. A slot price that moved between quote and
  signature is a decline with the reason; the client re-quotes.
- The old homemade 402 shape and the `/api/webhooks/x402` tx-hash callback
  are gone. No x402 client ever spoke them.

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
