# LAUNCH CHECKLIST

Last updated: January 4, 2026

## COMPLETED ✅

### Smart Contract & Blockchain
- [x] FlashCargo contract deployed to Base Sepolia (testnet)
- [x] FlashCargo contract deployed to Base Mainnet: `0xe6ec66d9b2caf0873bdf1499791c5d6f8a83f956`
- [x] Contract addresses configured in lib/contracts.ts
- [x] USDC integration (Base mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)

### Payment Infrastructure
- [x] x402 Protocol endpoint (`/api/payment/x402`)
- [x] Coinbase Commerce endpoint (`/api/payment/coinbase`)
- [x] Telegram Stars endpoint (`/api/payment/telegram`)
- [x] Webhook handlers for all payment methods
- [x] Settlement service (lib/settlement.ts)
- [x] Payment verification on-chain (lib/payment-verification.ts)
- [x] CDP wallet integration for server-side ops

### Frontend & UI
- [x] Landing page with hero
- [x] Drops page (mystery box marketplace)
- [x] Pallets page (funding tracker)
- [x] Juche page (VIP membership)
- [x] Admin dashboard
- [x] Checkout flow
- [x] Wallet connection (Wagmi/Viem)

### Database
- [x] Prisma schema defined
- [x] Drop, Order, User, Pallet models

---

## NEXT STEPS TO REVENUE 🚀

### CRITICAL PATH (Do These First)

#### Step 1: Deploy to Vercel (15 min)
```bash
git push origin main  # Already done!
```
Then in Vercel:
1. Go to vercel.com/new
2. Import `cherishwins/outlier-clothiers`
3. Deploy

#### Step 2: Set Environment Variables (10 min)
In Vercel dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_APP_URL=https://outlierclothiers.com
NEXT_PUBLIC_TESTNET=false

# Database
DATABASE_URL=postgresql://...

# Payments
COINBASE_COMMERCE_API_KEY=xxx
COINBASE_COMMERCE_WEBHOOK_SECRET=xxx

# Telegram
TELEGRAM_BOT_TOKEN=8074239038:AAFk7vlJay2uTKlCJbiSHPb0SDHp-t4rEhE

# CDP (for server-side contract calls)
CDP_API_KEY_ID=xxx
CDP_API_KEY_SECRET=xxx
```

#### Step 3: Set Up Database (15 min)
Option A: Supabase (free tier)
1. Create project at supabase.com
2. Get connection string
3. Add to Vercel env vars
4. Run: `npx prisma db push`

Option B: Neon (free tier)
1. Create project at neon.tech
2. Same steps

#### Step 4: Connect Domain (5 min)
In Vercel → Domains:
1. Add `outlierclothiers.com`
2. Update DNS at registrar:
   - CNAME → cname.vercel-dns.com

---

## MAKING MONEY (After Above Steps)

### Day 1: Create First Drop
1. Get manifest from ViaTrading
2. Create drop via admin or directly in database
3. Set funding target, deadline, slot prices

### Day 2: Announce on Telegram
1. Post drop to JUCHE GANG group
2. Share funding link
3. Respond to all questions

### Day 3-5: Monitor & Promote
- Track funding progress
- Share updates
- Push to crypto Twitter

### Day 6: If Funded
- Buy pallet
- Ship mystery boxes
- Collect testimonials

---

## REMAINING SETUP (Nice to Have)

### Legal & Business
- [ ] Register business entity (LLC or Corp)
- [ ] Get business bank account
- [ ] Set up accounting system
- [ ] Get business insurance

### Telegram Setup
- [ ] Create Telegram channel (@OutlierClothiers)
- [ ] Create Telegram group (JUCHE GANG)
- [ ] Configure Mini App in @BotFather
- [ ] Set webhook URL for bot

### Social Media
- [ ] Twitter/X (@OutlierClothiers)
- [ ] Instagram (@outlier.clothiers)
- [ ] TikTok (@outlierclothiers)

### Analytics & Monitoring
- [ ] Sentry for error tracking
- [ ] PostHog or GA4 for analytics

---

## QUICK REVENUE TARGETS

| Milestone | Target | Status |
|-----------|--------|--------|
| Contract deployed | ✓ | DONE |
| App deployed | Vercel | NEXT |
| Database ready | Postgres | NEXT |
| First drop live | 1 drop | This week |
| First sale | $50+ | This week |
| First pallet funded | $500+ | Week 1 |

---

## YOUR WALLET BALANCES

| Wallet | Network | Balance | Purpose |
|--------|---------|---------|---------|
| MetaMask (0xc3B...46d7) | Base | ~0.006 ETH | Future gas |
| MetaMask (0xc3B...46d7) | Ethereum | 0 ETH | - |
| CDP (0xd9d...73) | Ethereum | ~0.003 ETH | Can bridge |
| CDP (0xd9d...73) | Base | 0 ETH | - |

---

**YOU'RE 90% THERE.** Vercel deploy + database + first drop = money.
