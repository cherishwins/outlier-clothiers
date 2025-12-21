# TELEGRAM BOT SETUP GUIDE

## Creating Your Bot

### Step 1: Talk to BotFather
1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Choose a name: **OUTLIER CLOTHIERS**
4. Choose a username: **outlierclothiers_bot** (must end in "bot")
5. Copy the API token (keep this secret!)

### Step 2: Configure Bot Settings
Send these commands to BotFather:

```
/setdescription
@outlierclothiers_bot
Luxury surplus liquidation marketplace. 80% off designer goods. Pre-funded mystery drops.
```

```
/setabouttext
@outlierclothiers_bot
OUTLIER CLOTHIERS - Self-reliant luxury for the crypto-native. Pay with Stars, TON, or USDC.
```

```
/setuserpic
@outlierclothiers_bot
[Upload your 512x512 logo]
```

### Step 3: Enable Payments
```
/mybots
> Select @outlierclothiers_bot
> Payments
> Connect Telegram Stars
```

### Step 4: Set Bot Commands
```
/setcommands
@outlierclothiers_bot

drops - View active mystery drops
pallets - See funding progress
juche - Join VIP network
track - Track your order
earnings - Check referral earnings
help - Get support
```

### Step 3: Create Web App
```
/newapp
> Select @outlierclothiers_bot
> Name: OUTLIER Drops
> Description: Buy mystery boxes of luxury surplus
> Upload icon (512x512)
> URL: https://outlierclothiers.com/telegram-webapp
> Short name: outlier
```

### Step 2: Add Menu Button
```
/setmenubutton
> Select @outlierclothiers_bot
> Text: Open Store
> URL: https://outlierclothiers.com
```

## Mini App Integration


## Bot Logic (Server-Side)

### Required API Routes

Create these in your Next.js app:

```typescript
// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const update = await req.json()
  
  // Handle different update types
  if (update.message) {
    await handleMessage(update.message)
  }
  
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query)
  }
  
  if (update.pre_checkout_query) {
    await handlePreCheckout(update.pre_checkout_query)
  }
  
  return NextResponse.json({ ok: true })
}

async function handleMessage(message: any) {
  const chatId = message.chat.id
  const text = message.text
  
  if (text === '/start') {
    await sendWelcomeMessage(chatId)
  }
  
  if (text === '/drops') {
    await sendActiveDrops(chatId)
  }
}

async function sendWelcomeMessage(chatId: number) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🔥 Welcome to OUTLIER CLOTHIERS!\n\nSee active drops: /drops\nJoin VIP network: /juche',
      reply_markup: {
        inline_keyboard: [[
          { text: '🛍️ Open Store', web_app: { url: 'https://outlierclothiers.com' } }
        ]]
      }
    })
  })
}
```

### Set Webhook
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://outlierclothiers.com/api/telegram/webhook"
```

## Telegram Stars Payment Flow


## Group Management


## Analytics & Tracking


## Testing

### Local Development
Use **ngrok** to expose localhost for webhook testing:

```bash
ngrok http 3000
# Copy the HTTPS URL
# Set as webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://xxx.ngrok.io/api/telegram/webhook
```

### Test Payment Flow
Use Telegram's **test mode** for payments:
- Create test bot with @BotFather
- Use test Star balance
- Don't charge real money

---

**Ready to deploy?** Set your production webhook URL and go live!
