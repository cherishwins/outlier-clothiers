# OUTLIER CLOTHIERS / JUCHE GANG

**Luxury Surplus Liquidation Marketplace** powered by Telegram Stars, TON, and frictionless crypto payments.

## The Model

We buy canceled orders, overstock, and manufacturer surplus from luxury Chinese factories. You get 80% off retail. Factory gets tax write-offs. Everyone wins.

### How It Works

1. **Find Pallets** - Browse liquidation pallets from ViaTrading, B-Stock, Liquidation.com
2. **Pre-Fund Drops** - Customers pre-order mystery boxes before we buy
3. **Zero Risk** - Only buy pallets after reaching funding goal
4. **Ship Fast** - Fulfill orders within 7-10 days

## Three Experiences

### 1. MYSTERY DROPS (`/drops`)
Individual customers buy mystery boxes. Pre-order before we buy the pallet. Manifested inventory with transparent value estimates.

### 2. ACTIVE PALLETS (`/pallets`)
See real-time funding progress on liquidation pallets. Transparent manifest, source links, and funding goals.

### 3. JUCHE GANG (`/juche`)
VIP network for resellers and builders. Early pallet access, bulk pricing, member-only deals.

## Payment Integration

Three payment methods for maximum accessibility:

### 1. Coinbase Commerce (Easiest)
- Credit/debit cards accepted
- Automatic crypto conversion
- No wallet required

### 2. x402 Protocol (Instant)
- HTTP 402 Payment Required standard
- USDC/USDT stablecoin payments
- Zero friction for crypto natives

### 3. Telegram Stars/TON (Native)
- Pay directly in Telegram
- Stars or TON cryptocurrency
- Integrated with Telegram WebApp API

## Setup

### Environment Variables

Create a `.env.local` file:

```bash
# Coinbase Commerce
COINBASE_COMMERCE_API_KEY=your_coinbase_api_key_here

# x402 Payment Address (Base network)
X402_PAYMENT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Telegram Bot (for Stars/TON payments)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting API Keys

1. **Coinbase Commerce**: https://www.coinbase.com/commerce
   - Sign up for Coinbase Commerce
   - Create API key in Settings

2. **x402**: Set your crypto wallet address for Base network USDC

3. **Telegram Bot**: https://t.me/BotFather
   - Create bot with /newbot command
   - Copy bot token

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 16** - App Router with React Server Components
- **TailwindCSS v4** - Styling with design tokens
- **Radix UI** - Accessible component primitives
- **Coinbase Commerce** - Fiat → crypto payments
- **x402 Protocol** - HTTP-native crypto payments
- **Telegram WebApp API** - Native Telegram integration

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Add environment variables in Vercel project settings.

## Sourcing Strategy

### Liquidation Sources
- **ViaTrading**: https://www.viatrading.com/wholesale-products/f/manifested/load/
- **B-Stock**: https://bstock.com
- **Liquidation.com**: https://www.liquidation.com
- **Direct Factory Contact**: Negotiate surplus deals with Chinese manufacturers

### Why Factories Work With Us
- Tax write-offs for overstock
- Fast liquidation (within 7 days)
- No minimum order requirements
- Export to Canada → US distribution

## Legal

All products comply with local and international regulations. We verify legality before shipping. For educational and personal security purposes only.

---

Built by JUCHE GANG. Self-reliant. Anti-establishment. Future-focused.
