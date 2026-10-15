/**
 * Landed cost and the lowest price an item can sell for without losing money.
 *
 * A liquidation load is bought as one lot, so each sellable item carries a
 * share of the load's total landed cost (purchase, freight, brokerage, duty,
 * non-recoverable tax). Shipping is the other cost that decides whether an
 * item is worth listing: carriers bill the greater of the real weight and the
 * box's dimensional weight, so a small dense item can cost far more to ship
 * than a larger light one.
 *
 * Prices here are delivered prices: shipping is paid out of the price, never
 * added at checkout. Platform and payment fees are assumed to be rounded up
 * to the cent, each on its own, which is the worst case a seller can meet.
 * Money is integer cents in one currency throughout;
 * percentages are integer basis points (100 bps = 1%); weights are grams;
 * lengths are millimetres. No float touches money. Rates come from a function
 * the caller supplies (a rate table or a carrier API), so the arithmetic here
 * never guesses a price.
 */

export interface CarrierRule {
  /** Dimensional divisor in cm³ per kg (e.g. 5000 or 6000, per carrier). */
  divisorCm3PerKg: number
  /** Billable weight is rounded up to a multiple of this (e.g. 100 g, 500 g). */
  roundUpToGrams: number
  /** The least weight the carrier bills, in grams. */
  minBillableGrams: number
}

/** A field that is absent, null or 0 means "not measured yet" (manifests use all three). */
export interface Parcel {
  weightGrams: number
  lengthMm: number
  widthMm: number
  heightMm: number
}

export interface Fees {
  /** Marketplace or platform fee on the sale price. */
  platformBps: number
  platformFixedCents: number
  /** Payment processing (zero for a USDC payment the merchant collects). */
  paymentBps: number
  paymentFixedCents: number
  /** Allowance for returns and refunds, as a share of the price. */
  returnsBps: number
  /** The margin the price must leave after every cost, as a share of the price. */
  marginBps: number
  packagingCents: number
}

export interface PricingRules {
  /** Above this share of the price, shipping marks the item for bundling or pickup. */
  maxShipShareBps: number
}

/** Shipping cost in cents for this many billable grams, or null when no parcel service takes it. */
export type Rate = (billableGrams: number) => number | null

export interface RateStep {
  /** This price applies up to and including this billable weight. */
  upToGrams: number
  cents: number
}

export interface PriceCheck {
  dimGrams: number
  billableGrams: number
  /** Zero for a pickup-only item. */
  shippingCents: number
  /** The lowest whole-cent price that covers every cost and the margin; null if none can. */
  minPriceCents: number | null
  /**
   * The price to list at: the market price when it is known and covers (or the
   * next cent or two that does, once fees are rounded), otherwise the minimum;
   * null if none can.
   */
  listPriceCents: number | null
  /** Shipping as a share of the list price, rounded to the nearest basis point; null if there is no price. */
  shipShareBps: number | null
  verdict: "list" | "bundle-or-pickup" | "pickup-only" | "above-market" | "impossible" | "needs-data"
  reasons: string[]
}

const BPS = 10_000
const B = 10_000n
const MAX = BigInt(Number.MAX_SAFE_INTEGER)
const FEE_KEYS = [
  "platformBps",
  "platformFixedCents",
  "paymentBps",
  "paymentFixedCents",
  "returnsBps",
  "marginBps",
  "packagingCents",
] as const
const PARCEL_KEYS = ["weightGrams", "lengthMm", "widthMm", "heightMm"] as const

function isWhole(n: unknown, min: number): n is number {
  return typeof n === "number" && Number.isSafeInteger(n) && n >= min
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function ceilDiv(a: bigint, b: bigint): bigint {
  return (a + b - 1n) / b
}

function safe(n: bigint, what: string): number {
  if (n > MAX) throw new Error(`${what} is too large to handle exactly`)
  return Number(n)
}

function checkRule(rule: CarrierRule): void {
  if (!isRecord(rule)) throw new Error("rule must be an object")
  if (!isWhole(rule.divisorCm3PerKg, 1)) throw new Error("divisorCm3PerKg must be a whole number, 1 or more")
  if (!isWhole(rule.roundUpToGrams, 1)) throw new Error("roundUpToGrams must be a whole number, 1 or more")
  if (!isWhole(rule.minBillableGrams, 0)) throw new Error("minBillableGrams must be a whole number, zero or more")
}

function checkFees(fees: Fees): void {
  if (!isRecord(fees)) throw new Error("fees must be an object")
  for (const k of FEE_KEYS) {
    if (!isWhole(fees[k], 0)) throw new Error(`fees.${k} must be a whole number, zero or more`)
  }
  for (const k of Object.keys(fees)) {
    if (!(FEE_KEYS as readonly string[]).includes(k)) throw new Error(`fees.${k} is not a known fee`)
  }
}

/** "missing" when any measurement is absent, null or 0; throws when one is present but not a whole number above zero. */
function parcelState(parcel: Parcel | null | undefined): "missing" | "ok" {
  if (parcel === null || parcel === undefined) return "missing"
  if (!isRecord(parcel)) throw new Error("parcel must be an object or null")
  let missing = false
  for (const k of PARCEL_KEYS) {
    const v = parcel[k]
    if (v === undefined || v === null || v === 0) missing = true
    else if (!isWhole(v, 1)) throw new Error(`parcel.${k} must be a whole number above zero`)
  }
  return missing ? "missing" : "ok"
}

/**
 * The parcel's dimensional weight in grams: its volume divided by the
 * carrier's divisor, rounded up. mm³ / (cm³ per kg) is exactly grams.
 */
export function dimensionalGrams(parcel: Parcel, rule: CarrierRule): number {
  if (parcelState(parcel) !== "ok") throw new Error("weight and all three dimensions are needed")
  checkRule(rule)
  const volumeMm3 = BigInt(parcel.lengthMm) * BigInt(parcel.widthMm) * BigInt(parcel.heightMm)
  return safe(ceilDiv(volumeMm3, BigInt(rule.divisorCm3PerKg)), "dimensional weight")
}

/** What the carrier bills: the greater of real and dimensional weight, rounded up. */
export function billableGrams(parcel: Parcel, rule: CarrierRule): number {
  const heavier = Math.max(parcel.weightGrams, dimensionalGrams(parcel, rule), rule.minBillableGrams)
  const step = BigInt(rule.roundUpToGrams)
  return safe(ceilDiv(BigInt(heavier), step) * step, "billable weight")
}

/**
 * A rate from a weight-step table (a carrier's published chart, or quotes
 * you have taken): the first step whose upToGrams covers the weight. Above
 * the last step there is no parcel rate, so the answer is null.
 */
export function tableRate(steps: RateStep[]): Rate {
  if (!Array.isArray(steps) || steps.length === 0) throw new Error("a rate table needs at least one step")
  let last = 0
  for (const s of steps) {
    if (!isRecord(s) || !isWhole(s.upToGrams, 1) || !isWhole(s.cents, 0)) {
      throw new Error("each step needs whole upToGrams (1 or more) and cents (zero or more)")
    }
    if (s.upToGrams <= last) throw new Error("steps must be in increasing order of weight")
    last = s.upToGrams
  }
  const sorted = steps.map((s) => ({ upToGrams: s.upToGrams, cents: s.cents }))
  return (grams) => sorted.find((s) => grams <= s.upToGrams)?.cents ?? null
}

/**
 * Spread a load's total landed cost across its sellable items in proportion
 * to each item's weight in the split (usually its MSRP; pass 1 each to split
 * evenly). Unsellable items get nothing, so the junk in a load raises the cost
 * of what can be sold. A sellable item must carry weight above zero, so no
 * sellable item is ever treated as free. Largest-remainder rounding: the
 * shares always sum to the total exactly.
 */
export function allocateLoadCost(totalCents: number, weights: number[], sellable: boolean[]): number[] {
  if (!isWhole(totalCents, 0)) throw new Error("totalCents must be a whole number of cents, zero or more")
  if (!Array.isArray(weights) || !Array.isArray(sellable)) throw new Error("weights and sellable must be arrays")
  if (weights.length !== sellable.length) throw new Error("weights and sellable must be the same length")
  const used = weights.map((w, i) => {
    if (typeof sellable[i] !== "boolean") throw new Error("each sellable entry must be true or false")
    if (!isWhole(w, 0)) throw new Error("each weight must be a whole number, zero or more")
    if (sellable[i] && w === 0) throw new Error("a sellable item needs a weight above zero, or it would carry no cost")
    return sellable[i] ? BigInt(w) : 0n
  })
  const sum = used.reduce((a, b) => a + b, 0n)
  if (sum === 0n) {
    if (totalCents > 0) throw new Error("no item is sellable, so the load cost cannot be allocated")
    return used.map(() => 0)
  }
  const total = BigInt(totalCents)
  const shares = used.map((w) => (total * w) / sum)
  let left = total - shares.reduce((a, b) => a + b, 0n)
  const order = used
    .map((w, i) => ({ i, rem: (total * w) % sum }))
    .filter((x) => used[x.i] > 0n)
    .sort((a, b) => (a.rem === b.rem ? a.i - b.i : a.rem > b.rem ? -1 : 1))
  // left is less than the number of sellable items, so one pass suffices.
  for (let k = 0; left > 0n; k++, left--) shares[order[k].i] += 1n
  return shares.map(Number)
}

/**
 * The lowest price that pays for the item, its shipping and packaging, and
 * the fixed fees, after the platform and payment fees (each rounded up to the
 * cent) and while leaving the returns allowance and the margin:
 *   price − ⌈price × platform⌉ − ⌈price × payment⌉ − cost − shipping − packaging − fixed fees
 *     ≥ price × (returns + margin)
 * Because of the rounding, what a price keeps does not always rise with the
 * price, so every price is checked directly rather than assumed.
 */
export function checkPrice(input: {
  itemCostCents: number
  parcel: Parcel | null
  rule: CarrierRule
  rate: Rate
  fees: Fees
  rules: PricingRules
  /** What the item actually sells for (sold listings), if known; null or absent means unknown. */
  marketPriceCents?: number | null
}): PriceCheck {
  const { itemCostCents, parcel, rule, rate, fees, rules } = input
  const market = input.marketPriceCents ?? null
  checkRule(rule)
  checkFees(fees)
  if (typeof rate !== "function") throw new Error("rate must be a function from billable grams to cents")
  if (!isRecord(rules) || !isWhole(rules.maxShipShareBps, 0)) throw new Error("rules.maxShipShareBps must be a whole number, zero or more")
  if (!isWhole(itemCostCents, 0)) throw new Error("itemCostCents must be a whole number of cents, zero or more")
  if (market !== null && !isWhole(market, 0)) throw new Error("marketPriceCents must be a whole number of cents, zero or more")

  const blank = { dimGrams: 0, billableGrams: 0, shippingCents: 0, minPriceCents: null, listPriceCents: null, shipShareBps: null }
  const pctBps = fees.platformBps + fees.paymentBps + fees.returnsBps + fees.marginBps
  if (pctBps >= BPS) {
    return { ...blank, verdict: "impossible", reasons: ["fees, returns allowance and margin add up to 100% or more of the price"] }
  }
  if (parcelState(parcel) === "missing") {
    return { ...blank, verdict: "needs-data", reasons: ["weight and all three dimensions are needed to price shipping"] }
  }
  const box = parcel as Parcel

  const dim = dimensionalGrams(box, rule)
  const billable = billableGrams(box, rule)
  const quoted = rate(billable)
  if (quoted !== null && !isWhole(quoted, 0)) throw new Error("rate must return whole cents (zero or more) or null")
  const shipping = quoted ?? 0
  const reasons: string[] = []
  if (dim > box.weightGrams) reasons.push(`billed on size: ${dim} g dimensional vs ${box.weightGrams} g actual`)

  const plat = BigInt(fees.platformBps)
  const pay = BigInt(fees.paymentBps)
  const keepBack = BigInt(fees.returnsBps + fees.marginBps)
  const fixed =
    BigInt(itemCostCents) + BigInt(shipping) + BigInt(fees.packagingCents) + BigInt(fees.platformFixedCents) + BigInt(fees.paymentFixedCents)
  const covers = (p: bigint) => (p - ceilDiv(p * plat, B) - ceilDiv(p * pay, B) - fixed) * B >= p * keepBack
  const room = B - BigInt(pctBps)
  // Without rounding, this is the exact answer; rounding can only push it up.
  let minPrice = ceilDiv(fixed * B, room)
  // Each rounded fee costs under a cent, so from here up every price covers.
  const allCover = ceilDiv((fixed + 2n) * B, room)
  while (!covers(minPrice)) minPrice++
  if (minPrice > allCover) throw new Error("internal: minimum price search overran its bound")
  safe(minPrice, "the minimum price")

  let verdict: PriceCheck["verdict"] = "list"
  let listPrice = minPrice
  if (quoted === null) {
    verdict = "pickup-only"
    reasons.push(`no parcel rate at ${billable} g; the minimum assumes local pickup`)
  }
  if (market !== null && BigInt(market) < minPrice) {
    verdict = "above-market"
    reasons.push(`needs ${minPrice} cents but sells for about ${market}`)
  } else if (market !== null) {
    // The market price itself, or the next cent or two that covers after rounding.
    listPrice = BigInt(market)
    while (!covers(listPrice)) listPrice++
  }
  const ship = BigInt(shipping)
  const shipShare = listPrice === 0n ? 0n : (2n * ship * B + listPrice) / (2n * listPrice)
  if (verdict === "list" && ship * B > BigInt(rules.maxShipShareBps) * listPrice) {
    verdict = "bundle-or-pickup"
    reasons.push(`shipping is over ${rules.maxShipShareBps / 100}% of the price (about ${Number(shipShare) / 100}%)`)
  }

  return {
    dimGrams: dim,
    billableGrams: billable,
    shippingCents: shipping,
    minPriceCents: Number(minPrice),
    listPriceCents: safe(listPrice, "the list price"),
    shipShareBps: Number(shipShare),
    verdict,
    reasons,
  }
}
