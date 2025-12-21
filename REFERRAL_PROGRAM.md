# REFERRAL PROGRAM

## Overview

Give your customers a reason to spread the word. Pay 10% commission on all referred sales.

## How It Works

### For Customers
1. Share your unique referral link
2. When someone buys using your link, you earn 10% commission
3. Withdraw earnings anytime (minimum $50)
4. Track earnings in app: `/earnings` command

### For You (Platform)
- Automated tracking via URL parameters
- Commission held in escrow until delivery confirmed
- Releases after 30-day return window
- Reduces customer acquisition cost to near-zero

## Implementation

### Generate Referral Links
```typescript
// components/referral/referral-link.tsx
export function ReferralLink({ userId }: { userId: string }) {
  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}?ref=${userId}`
  
  return (
    <div>
      <input value={referralLink} readOnly />
      <button onClick={() => navigator.clipboard.writeText(referralLink)}>
        Copy Link
      </button>
    </div>
  )
}
```

### Track Referrals
```typescript
// app/page.tsx
export default async function Home({ searchParams }) {
  const refCode = searchParams.ref
  
  if (refCode) {
    // Store in cookie or local storage
    cookies().set('referral_code', refCode, { maxAge: 30 * 24 * 60 * 60 }) // 30 days
  }
  
  // Rest of page...
}
```

### Calculate Commissions
```typescript
// app/api/payment/complete/route.ts
async function recordCommission(orderId: string) {
  const order = await getOrder(orderId)
  const referralCode = order.referralCode
  
  if (referralCode) {
    const commission = order.amount * 0.10
    
    await createCommission({
      referrerId: referralCode,
      orderId: orderId,
      amount: commission,
      status: 'pending', // Becomes 'payable' after 30 days
      createdAt: new Date()
    })
  }
}
```

### Commission Dashboard
```typescript
// app/api/referrals/earnings/route.ts
export async function GET(req: Request) {
  const userId = getUserFromSession(req)
  
  const earnings = await db.query(`
    SELECT 
      COUNT(*) as total_referrals,
      SUM(CASE WHEN status = 'payable' THEN amount ELSE 0 END) as available,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
      SUM(amount) as lifetime_earnings
    FROM commissions
    WHERE referrer_id = $1
  `, [userId])
  
  return Response.json(earnings)
}
```

## Telegram Bot Integration

### /earnings Command
```typescript
async function handleEarningsCommand(chatId: number, userId: string) {
  const earnings = await getReferralEarnings(userId)
  
  const message = `
💰 YOUR REFERRAL EARNINGS 💰

Available: $${earnings.available.toFixed(2)}
Pending: $${earnings.pending.toFixed(2)}
Lifetime: $${earnings.lifetime.toFixed(2)}

Total Referrals: ${earnings.total_referrals}

Share your link to earn more:
${process.env.NEXT_PUBLIC_APP_URL}?ref=${userId}

[Withdraw Button] (minimum $50)
  `
  
  await sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [[
        { text: '💸 Withdraw Earnings', callback_data: 'withdraw' }
      ]]
    }
  })
}
```

## Withdrawal System

### Crypto Payouts (Easiest)
```typescript
async function processWithdrawal(userId: string, walletAddress: string) {
  const earnings = await getAvailableEarnings(userId)
  
  if (earnings < 50) {
    throw new Error('Minimum withdrawal is $50')
  }
  
  // Send USDC to their wallet
  await sendUSDC(walletAddress, earnings)
  
  // Mark as paid
  await markCommissionsAsPaid(userId)
  
  // Notify user
  await sendMessage(userId, `✅ $${earnings} sent to your wallet!`)
}
```

### Alternative: In-Store Credit
```typescript
// Give credit toward next purchase
async function grantStoreCredit(userId: string) {
  const earnings = await getAvailableEarnings(userId)
  
  await db.query(`
    INSERT INTO store_credits (user_id, amount, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '1 year')
  `, [userId, earnings])
  
  await sendMessage(userId, `✅ $${earnings} added as store credit!`)
}
```

## Leaderboard

### Top Referrers
```typescript
// components/referral/leaderboard.tsx
export async function ReferralLeaderboard() {
  const topReferrers = await db.query(`
    SELECT 
      u.username,
      COUNT(*) as total_referrals,
      SUM(c.amount) as total_earned
    FROM commissions c
    JOIN users u ON c.referrer_id = u.id
    GROUP BY u.id
    ORDER BY total_earned DESC
    LIMIT 10
  `)
  
  return (
    <div>
      <h2>TOP REFERRERS 🏆</h2>
      {topReferrers.map((user, i) => (
        <div key={user.username}>
          #{i + 1} @{user.username} - ${user.total_earned} earned
        </div>
      ))}
    </div>
  )
}
```

## Marketing the Program

### Social Media Post
```
💰 EARN WHILE YOU FLEX 💰

Refer friends to OUTLIER CLOTHIERS
→ They get 80% off designer goods
→ You get 10% commission on EVERY sale

No limits. No catches. Pure passive income.

Get your link: /earnings

#JUCHE #PassiveIncome
```

### In-Group Promotion
```
🚨 ANNOUNCEMENT 🚨

We're launching a referral program

Share your link → Earn 10% on every sale
Minimum withdrawal: $50

Top referrer this month wins a FREE mystery box 🎁

Type /earnings to get your link
```

## Viral Mechanics

### Tier Bonuses
- **10 referrals**: +5% commission (15% total)
- **50 referrals**: +10% commission (20% total)
- **100 referrals**: Lifetime 25% commission

### Contests
- Monthly: "Top referrer wins $500"
- Weekly: "Most referrals this week gets early access"

### Gamification
Display badges on profile:
- 🥉 Bronze: 10 referrals
- 🥈 Silver: 50 referrals
- 🥇 Gold: 100 referrals
- 💎 Diamond: 500 referrals

---

**Referrals turn customers into salespeople. This is how you scale without ads.**
