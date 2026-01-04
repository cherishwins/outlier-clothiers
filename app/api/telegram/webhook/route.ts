import { type NextRequest, NextResponse } from "next/server"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
  }
}

async function sendMessage(chatId: number, text: string, options?: { parse_mode?: string; reply_markup?: unknown }) {
  if (!BOT_TOKEN) return

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || "HTML",
      reply_markup: options?.reply_markup,
    }),
  })
}

const WELCOME_MESSAGE = `
<b>OUTLIER CLOTHIERS</b>
<i>Luxury Surplus Liquidation</i>

80% off retail. Factory overstock. Zero middlemen.

<b>HOW IT WORKS:</b>
1. We source liquidation pallets
2. You pre-order mystery boxes
3. Once funded, we buy & ship

<b>CURRENT DROP:</b>
154K items | $672K retail value
Beauty, apparel, sunglasses & more

Use /drops to see active drops
Use /prices to see box pricing
Use /shop to open the web store
`

const DROPS_MESSAGE = `
<b>ACTIVE DROPS</b>

<b>DROP #1: LUXURY MIX</b>
154,373 items from top brands
Retail Value: $672,550
Your Cost: $186,218 (72% off!)

<b>WHAT'S INSIDE:</b>
- Essie, Maybelline, L'Oreal cosmetics
- BOZZOLO, ZENANA apparel
- Designer sunglasses
- Premium shoes

<b>STATUS:</b> Funding Open

Tap below to claim your slot:
`

const PRICES_MESSAGE = `
<b>MYSTERY BOX PRICING</b>

<b>SMALL BOX</b> - $15 (5 items)
<b>MEDIUM BOX</b> - $35 (15 items)
<b>LARGE BOX</b> - $70 (35 items)

<b>PAY WITH:</b>
Telegram Stars | TON | USDC

<b>TIERED PRICING:</b>
First 500 slots: Base price
Next 300 slots: +30%
Last 200 slots: +60%

<i>Get in early for best pricing!</i>
`

const MANIFEST_MESSAGE = `
<b>CURRENT MANIFEST</b>

<b>SOURCE:</b> Direct Liquidation
<b>CATEGORY:</b> Beauty & Apparel

<b>TOP BRANDS:</b>
- BOZZOLO: 25,105 units
- KAVIO: 18,147 units
- POPULAR 21: 13,021 units
- ZENANA: 11,570 units
- Essie, L'Oreal, Maybelline

<b>CATEGORIES:</b>
- Apparel: 102,811 units
- Cosmetics: 8,642 units
- Skincare: 3,443 units
- Shoes: 4,310 units

Full manifest: outlierclothiers.com/drops
`

const HELP_MESSAGE = `
<b>NEED HELP?</b>

<b>FAQ:</b>

<b>Q: How do I pay?</b>
A: Telegram Stars, TON, or USDC

<b>Q: When does it ship?</b>
A: 7-10 days after pallet is funded

<b>Q: What if funding fails?</b>
A: Full auto-refund via smart contract

<b>Q: Is it random?</b>
A: Yes, but manifested - you see the value range

<b>LINKS:</b>
Website: outlierclothiers.com
Shop: /shop

<b>CONTACT:</b>
DM us here or email: gm@outlierclothiers.com
`

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()

    if (!update.message?.text) {
      return NextResponse.json({ ok: true })
    }

    const chatId = update.message.chat.id
    const text = update.message.text.toLowerCase()
    const firstName = update.message.from.first_name

    // Handle commands
    if (text.startsWith("/start")) {
      await sendMessage(chatId, `Hey ${firstName}!\n${WELCOME_MESSAGE}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "See Drops", callback_data: "drops" },
              { text: "View Prices", callback_data: "prices" },
            ],
            [{ text: "Open Shop", url: "https://outlierclothiers.com/drops" }],
          ],
        },
      })
    } else if (text.startsWith("/drops")) {
      await sendMessage(chatId, DROPS_MESSAGE, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Claim Small Box - $15", callback_data: "buy_small" }],
            [{ text: "Claim Medium Box - $35", callback_data: "buy_medium" }],
            [{ text: "Claim Large Box - $70", callback_data: "buy_large" }],
          ],
        },
      })
    } else if (text.startsWith("/prices")) {
      await sendMessage(chatId, PRICES_MESSAGE)
    } else if (text.startsWith("/manifest")) {
      await sendMessage(chatId, MANIFEST_MESSAGE)
    } else if (text.startsWith("/shop")) {
      await sendMessage(chatId, "Opening the shop...", {
        reply_markup: {
          inline_keyboard: [[{ text: "Open Shop", url: "https://outlierclothiers.com/drops" }]],
        },
      })
    } else if (text.startsWith("/help")) {
      await sendMessage(chatId, HELP_MESSAGE)
    } else {
      // Default response
      await sendMessage(
        chatId,
        `Hey ${firstName}! Use /start to see what we're about, or /drops to see active mystery box drops.`
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ ok: true })
  }
}

// Verify webhook is working
export async function GET() {
  return NextResponse.json({
    status: "Outlier Clothiers Bot Webhook Active",
    commands: ["/start", "/drops", "/shop", "/manifest", "/prices", "/help"],
  })
}
