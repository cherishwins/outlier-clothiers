# Environment Variables Configuration

Copy these to `.env.local` and fill in your values.

## App Configuration

```bash
NEXT_PUBLIC_APP_URL=https://outlierclothiers.com
NEXT_PUBLIC_TESTNET=true  # Set to false for mainnet
```

## Database (PostgreSQL via Supabase, Neon, or Railway)

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

## Blockchain - FlashCargo Contract

After deploying to mainnet with `npx ts-node scripts/deploy-cdp.ts`:

```bash
NEXT_PUBLIC_FLASHCARGO_ADDRESS=0x...
```

## CDP (Coinbase Developer Platform) - Server-side operations

Get from: https://portal.cdp.coinbase.com

```bash
CDP_API_KEY_ID=
CDP_API_KEY_SECRET=
CDP_WALLET_SECRET=
CDP_ACCOUNT_NAME=outlier-server
```

## x402 Payment - Direct USDC payments

Fallback address if contract not set (use your wallet address):

```bash
X402_PAYMENT_ADDRESS=0x...
```

## Coinbase Commerce - Fiat onramp

Get from: https://commerce.coinbase.com/dashboard

```bash
COINBASE_COMMERCE_API_KEY=
COINBASE_WEBHOOK_SECRET=
```

## Telegram Bot - Stars/TON payments

Get from: @BotFather

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=OutlierClothiersBot
TELEGRAM_WEBHOOK_SECRET=
```

## Shipping - EasyPost

Get from: https://easypost.com/dashboard

```bash
EASYPOST_API_KEY=
```

## Optional - Analytics & Monitoring

```bash
# Sentry error tracking
SENTRY_DSN=

# PostHog analytics
POSTHOG_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
```

## AI - Vercel AI Gateway (Text/Reasoning/Vision)

Used by the Outlier “Voice Concierge” (press-to-talk assistant).

```bash
# Create/manage keys in Vercel: https://vercel.com/~/
AI_GATEWAY_API_KEY=

# Optional overrides
AI_GATEWAY_MODEL=xai/grok-4.1-fast-non-reasoning
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v3/ai
```

### Optional: Voice transcription (for press-to-talk audio upload)

If you want server-side transcription from recorded audio (works even without browser speech recognition),
set **one** of:

```bash
GROQ_API_KEY=
OPENAI_API_KEY=
```

---

## Deployment Checklist

Before going live:

1. [ ] Set `NEXT_PUBLIC_TESTNET=false`
2. [ ] Deploy FlashCargo to mainnet: `npx ts-node scripts/deploy-cdp.ts`
3. [ ] Set `NEXT_PUBLIC_FLASHCARGO_ADDRESS` with deployed address
4. [ ] Fund CDP wallet with ETH for gas (~0.01 ETH)
5. [ ] Fund CDP wallet with USDC for operations
6. [ ] Configure webhook URLs in provider dashboards:
   - Coinbase: `{APP_URL}/api/webhooks/coinbase`
   - Telegram: `{APP_URL}/api/webhooks/telegram`
   - EasyPost: `{APP_URL}/api/webhooks/easypost`

## Webhook Setup

### Coinbase Commerce

1. Go to https://commerce.coinbase.com/dashboard/settings
2. Add webhook endpoint: `https://outlierclothiers.com/api/webhooks/coinbase`
3. Copy the webhook secret to `COINBASE_WEBHOOK_SECRET`

### Telegram

1. Use BotFather to set webhook: 
   ```
   /setwebhook https://outlierclothiers.com/api/webhooks/telegram
   ```
2. Or via API:
   ```bash
   curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
     -d "url=https://outlierclothiers.com/api/webhooks/telegram" \
     -d "secret_token={TELEGRAM_WEBHOOK_SECRET}"
   ```

### x402

x402 payments use a callback URL automatically included in the payment request.
No additional configuration needed.
