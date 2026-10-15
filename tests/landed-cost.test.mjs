// npm test  (node --test; Node 22.18+ strips the types from the .ts import)
import assert from "node:assert/strict"
import { test } from "node:test"

import { allocateLoadCost, billableGrams, checkPrice, dimensionalGrams, tableRate } from "../lib/landed-cost.ts"

const RULE = { divisorCm3PerKg: 5000, roundUpToGrams: 100, minBillableGrams: 100 }
const RATE = tableRate([
  { upToGrams: 500, cents: 900 },
  { upToGrams: 1000, cents: 1200 },
  { upToGrams: 2000, cents: 1700 },
  { upToGrams: 5000, cents: 2600 },
  { upToGrams: 30000, cents: 6500 },
])
// 13% + $0.30 platform, nothing for a USDC payment, 5% returns, 20% margin.
const FEES = {
  platformBps: 1300,
  platformFixedCents: 30,
  paymentBps: 0,
  paymentFixedCents: 0,
  returnsBps: 500,
  marginBps: 2000,
  packagingCents: 100,
}
const RULES = { maxShipShareBps: 3500 }
const SHOEBOX = { lengthMm: 300, widthMm: 250, heightMm: 50 }
const SWEATER = { weightGrams: 400, ...SHOEBOX }
const DENSE = { weightGrams: 2500, ...SHOEBOX }
const price = (over) => checkPrice({ itemCostCents: 1000, rule: RULE, rate: RATE, fees: FEES, rules: RULES, ...over })

// An independent reference: each fee rounded up on its own, returns and margin
// kept exactly, and the smallest covering price found by counting up one cent
// at a time.
function keeps(p, fixed, f) {
  const plat = Math.ceil((p * f.platformBps) / 10000)
  const pay = Math.ceil((p * f.paymentBps) / 10000)
  return (p - plat - pay - fixed) * 10000 >= p * (f.returnsBps + f.marginBps)
}
function bruteMin(fixed, f) {
  let p = fixed
  while (!keeps(p, fixed, f)) p++
  return p
}
const fixedOf = (cost, ship, f) => cost + ship + f.packagingCents + f.platformFixedCents + f.paymentFixedCents

test("dimensional weight is volume over the carrier's divisor, in grams, rounded up", () => {
  const box = { weightGrams: 1000, lengthMm: 400, widthMm: 400, heightMm: 300 }
  assert.equal(dimensionalGrams(box, RULE), 9600)
  assert.equal(dimensionalGrams(box, { ...RULE, divisorCm3PerKg: 6000 }), 8000)
  assert.equal(dimensionalGrams({ ...box, lengthMm: 401, widthMm: 401, heightMm: 301 }, RULE), 9681)
})

test("billable weight is the heavier of real and dimensional, never under the minimum, rounded up", () => {
  assert.equal(dimensionalGrams(SWEATER, RULE), 750)
  assert.equal(billableGrams(SWEATER, RULE), 800)
  assert.equal(billableGrams(DENSE, RULE), 2500)
  const tiny = { weightGrams: 20, lengthMm: 10, widthMm: 10, heightMm: 10 }
  assert.equal(billableGrams(tiny, { ...RULE, minBillableGrams: 300 }), 300)
  assert.equal(billableGrams(tiny, { ...RULE, minBillableGrams: 0 }), 100)
  assert.equal(billableGrams(tiny, { ...RULE, roundUpToGrams: 500 }), 500)
})

test("same box, same look: the sweater lists, the dense item does not ship alone", () => {
  const sweater = price({ parcel: SWEATER })
  assert.equal(sweater.shippingCents, 1200)
  // (1000 cost + 1200 ship + 100 pack + 30 fixed) / (1 - 38%) = 3758.06, rounded up; the rounded fee still fits
  assert.equal(sweater.minPriceCents, 3759)
  assert.equal(sweater.listPriceCents, 3759)
  assert.equal(sweater.shipShareBps, 3192)
  assert.equal(sweater.verdict, "list")
  assert.match(sweater.reasons[0], /billed on size: 750 g dimensional vs 400 g actual/)

  const dense = price({ parcel: DENSE })
  assert.equal(dense.shippingCents, 2600)
  // 6017 would keep 1504 against 1504.25 once the 13% fee is rounded up to 783
  assert.equal(dense.minPriceCents, 6018)
  assert.equal(dense.shipShareBps, 4320)
  assert.equal(dense.verdict, "bundle-or-pickup")
  assert.equal(dense.reasons.length, 1)
})

test("the minimum price is the smallest price that covers, with each fee rounded up on its own", () => {
  const feeSets = [
    FEES,
    { ...FEES, platformBps: 1300, platformFixedCents: 30, paymentBps: 290, paymentFixedCents: 30, returnsBps: 0, marginBps: 0 },
    { ...FEES, paymentBps: 290, paymentFixedCents: 30 },
    { ...FEES, platformBps: 1000, paymentBps: 0, returnsBps: 0, marginBps: 0, packagingCents: 0, platformFixedCents: 0 },
    { ...FEES, platformBps: 3000, paymentBps: 350, returnsBps: 1500, marginBps: 3000 },
  ]
  let checked = 0
  for (const f of feeSets) {
    for (let cost = 0; cost <= 6000; cost += 7) {
      const r = price({ itemCostCents: cost, parcel: SWEATER, fees: f })
      const fixed = fixedOf(cost, 1200, f)
      assert.equal(r.minPriceCents, bruteMin(fixed, f), `cost ${cost} with ${JSON.stringify(f)}`)
      checked++
    }
  }
  assert.ok(checked > 4000)
  // The case that broke the single-rounding formula: it said 1621, which keeps 1362 of 1363.
  const twoFees = { ...FEES, paymentBps: 290, paymentFixedCents: 30, returnsBps: 0, marginBps: 0 }
  assert.equal(price({ itemCostCents: 3, parcel: SWEATER, fees: twoFees }).minPriceCents, 1622)
})

test("a known market price is what the item lists at, and decides above-market", () => {
  const sells = price({ parcel: DENSE, marketPriceCents: 8000 })
  assert.equal(sells.minPriceCents, 6018)
  assert.equal(sells.listPriceCents, 8000)
  assert.equal(sells.shipShareBps, 3250)
  assert.equal(sells.verdict, "list")

  const cheap = price({ parcel: DENSE, marketPriceCents: 4500 })
  assert.equal(cheap.verdict, "above-market")
  assert.match(cheap.reasons.at(-1), /needs 6018 cents but sells for about 4500/)

  assert.equal(price({ parcel: DENSE, marketPriceCents: null }).verdict, "bundle-or-pickup")
})

test("the bundle limit is decided exactly, and the share is rounded only for display", () => {
  // 2600 / 7428 is 35.0027%: over a 35% limit, though it displays as 3500.
  const over = price({ parcel: DENSE, marketPriceCents: 7428 })
  assert.equal(over.shipShareBps, 3500)
  assert.equal(over.verdict, "bundle-or-pickup")
  // 2600 / 7429 is 34.998%: within the limit, and rounds to the nearest, not down.
  const under = price({ parcel: DENSE, marketPriceCents: 7429 })
  assert.equal(under.shipShareBps, 3500)
  assert.equal(under.verdict, "list")
  // Exactly at the limit is not over it: 2600 / 8000 is 32.50%.
  const at = price({ parcel: DENSE, marketPriceCents: 8000, rules: { maxShipShareBps: 3250 } })
  assert.equal(at.shipShareBps, 3250)
  assert.equal(at.verdict, "list")
})

test("a market price in a rounding dip lists at the next price that covers", () => {
  // 13% + 30c platform, 5% returns, no margin: 3400 covers, but at 3401 the fee
  // rounds up to 443 and keeps 170 against 170.05; 3402 covers again.
  const fees = { ...FEES, marginBps: 0 }
  const r = price({ itemCostCents: 58, parcel: DENSE, fees, marketPriceCents: 3401 })
  assert.equal(r.minPriceCents, 3400)
  assert.equal(r.listPriceCents, 3402)
  assert.equal(r.shipShareBps, 7643)
  assert.ok(keeps(3400, 2788, fees) && !keeps(3401, 2788, fees) && keeps(3402, 2788, fees))
  assert.equal(price({ itemCostCents: 58, parcel: DENSE, fees, marketPriceCents: 3400 }).listPriceCents, 3400)
})

test("no parcel rate means pickup only, priced without shipping", () => {
  const sofa = { weightGrams: 35000, lengthMm: 2000, widthMm: 900, heightMm: 800 }
  const r = price({ parcel: sofa })
  assert.equal(r.shippingCents, 0)
  assert.equal(r.minPriceCents, 1823)
  assert.equal(r.verdict, "pickup-only")
  assert.equal(price({ parcel: sofa, marketPriceCents: 1000 }).verdict, "above-market")
})

test("fees, returns and margin at 100% or more can never be priced, whatever the parcel", () => {
  // 13% platform + 5% returns + 82% margin = 100%
  const all = { ...FEES, marginBps: 8200 }
  for (const parcel of [SWEATER, null]) {
    const r = price({ parcel, fees: all })
    assert.equal(r.verdict, "impossible")
    assert.equal(r.minPriceCents, null)
    assert.equal(r.listPriceCents, null)
    assert.equal(r.shipShareBps, null)
  }
  // one basis point under: priced, at 10000 times what it costs
  assert.equal(price({ parcel: SWEATER, fees: { ...FEES, marginBps: 8199 } }).minPriceCents, 2330 * 10000)
})

test("an item with a missing measurement waits for data; a wrong one is refused", () => {
  for (const parcel of [null, undefined, { weightGrams: 0, ...SHOEBOX }, { weightGrams: 400, lengthMm: 300, widthMm: 250 }, { ...SWEATER, heightMm: null }]) {
    const r = price({ parcel })
    assert.equal(r.verdict, "needs-data")
    assert.equal(r.minPriceCents, null)
  }
  assert.throws(() => price({ parcel: { ...SWEATER, weightGrams: "400" } }), /parcel\.weightGrams must be a whole number above zero/)
  assert.throws(() => price({ parcel: { ...SWEATER, lengthMm: -1 } }), /parcel\.lengthMm must be a whole number above zero/)
  assert.throws(() => price({ parcel: { ...SWEATER, weightGrams: 400.5 } }), /parcel\.weightGrams must be a whole number above zero/)
})

test("every fee must be present, known and whole", () => {
  const { marginBps, ...noMargin } = FEES
  assert.throws(() => price({ parcel: SWEATER, fees: noMargin }), /fees\.marginBps must be a whole number/)
  const { platformBps, ...misspelt } = FEES
  assert.throws(() => price({ parcel: SWEATER, fees: { ...misspelt, platfromBps: platformBps } }), /fees\.platformBps must be a whole number/)
  assert.throws(() => price({ parcel: SWEATER, fees: { ...FEES, listingFeeCents: 2000 } }), /fees\.listingFeeCents is not a known fee/)
  assert.throws(() => price({ parcel: SWEATER, fees: { ...FEES, currency: "CAD" } }), /fees\.currency is not a known fee/)
  assert.throws(() => price({ parcel: SWEATER, fees: { ...FEES, returnsBps: -100 } }), /fees\.returnsBps must be a whole number/)
  assert.throws(() => price({ parcel: SWEATER, fees: null }), /fees must be an object/)
})

test("bad money, rules and rates are refused with a reason", () => {
  assert.throws(() => price({ parcel: SWEATER, itemCostCents: 10.5 }), /itemCostCents must be a whole number/)
  assert.throws(() => price({ parcel: SWEATER, itemCostCents: -1 }), /itemCostCents must be a whole number/)
  assert.throws(() => price({ parcel: SWEATER, rate: () => 12.5 }), /rate must return whole cents/)
  assert.throws(() => price({ parcel: SWEATER, rate: undefined }), /rate must be a function/)
  assert.throws(() => price({ parcel: SWEATER, marketPriceCents: -5 }), /marketPriceCents must be a whole number/)
  assert.throws(() => price({ parcel: SWEATER, rules: undefined }), /maxShipShareBps must be a whole number/)
  assert.throws(() => price({ parcel: SWEATER, rule: { ...RULE, divisorCm3PerKg: 0 } }), /divisorCm3PerKg must be a whole number/)
  assert.throws(() => dimensionalGrams({ weightGrams: 1, lengthMm: -1, widthMm: 1, heightMm: 1 }, RULE), /parcel\.lengthMm must be a whole number above zero/)
})

test("figures too large to handle exactly are refused, not rounded", () => {
  const huge = { weightGrams: 1, lengthMm: 2 ** 40, widthMm: 2 ** 40, heightMm: 2 ** 40 }
  assert.throws(() => dimensionalGrams(huge, RULE), /too large to handle exactly/)
  assert.throws(
    () => price({ parcel: SWEATER, itemCostCents: Number.MAX_SAFE_INTEGER - 10 }),
    /the minimum price is too large to handle exactly/,
  )
})

test("a rate table charges the first step that covers the weight, and nothing past the last", () => {
  assert.equal(RATE(100), 900)
  assert.equal(RATE(500), 900)
  assert.equal(RATE(501), 1200)
  assert.equal(RATE(30000), 6500)
  assert.equal(RATE(30001), null)
  assert.equal(tableRate([{ upToGrams: 500, cents: 0 }])(1), 0)
  assert.throws(() => tableRate([]), /at least one step/)
  assert.throws(() => tableRate([{ upToGrams: 1000, cents: 1 }, { upToGrams: 500, cents: 2 }]), /increasing order/)
  assert.throws(() => tableRate([{ upToGrams: 500, cents: 1.5 }]), /whole upToGrams/)
})

test("the load cost is shared by sellable items only and sums to the cent", () => {
  assert.deepEqual(allocateLoadCost(1000, [1, 1, 1], [true, true, true]), [334, 333, 333])
  assert.deepEqual(allocateLoadCost(100000, [5000, 2000, 3000, 9999], [true, true, false, false]), [71429, 28571, 0, 0])
  assert.deepEqual(allocateLoadCost(0, [1, 2], [false, false]), [0, 0])
  assert.deepEqual(allocateLoadCost(500, [0, 7], [false, true]), [0, 500])
  assert.throws(() => allocateLoadCost(1, [1, 2], [false, false]), /no item is sellable/)
  assert.throws(() => allocateLoadCost(100, [1, 2], [true]), /same length/)
  assert.throws(() => allocateLoadCost(100.5, [1], [true]), /totalCents must be a whole number/)
  assert.throws(() => allocateLoadCost(100, [-1], [true]), /each weight must be a whole number/)
  assert.throws(() => allocateLoadCost(1000, [1, 1, 1], [1, true, 0]), /must be true or false/)
  assert.throws(() => allocateLoadCost(1000, [1, 1], [true, "true"]), /must be true or false/)
  assert.throws(() => allocateLoadCost(1000, [0, 1], [true, true]), /needs a weight above zero/)
})

// Each share is the floor of its exact share, plus one cent for the items
// with the largest remainders (ties to the earlier item).
function assertLargestRemainder(total, weights, sellable, out) {
  const t = BigInt(total)
  const used = weights.map((w, i) => (sellable[i] ? BigInt(w) : 0n))
  const sum = used.reduce((a, b) => a + b, 0n)
  assert.equal(out.reduce((a, b) => a + BigInt(b), 0n), t)
  const rows = used.map((w, i) => ({ i, floor: sum === 0n ? 0n : (t * w) / sum, rem: sum === 0n ? 0n : (t * w) % sum, w }))
  const bumped = rows.filter((r) => BigInt(out[r.i]) === r.floor + 1n)
  const plain = rows.filter((r) => BigInt(out[r.i]) === r.floor)
  assert.equal(bumped.length + plain.length, rows.length, "every share is its floor or its floor plus one")
  for (const b of bumped) {
    assert.ok(b.w > 0n, "an unsellable item never gets a cent")
    for (const p of plain.filter((p) => p.w > 0n)) {
      assert.ok(b.rem > p.rem || (b.rem === p.rem && b.i < p.i), `item ${b.i} got the extra cent ahead of item ${p.i}`)
    }
  }
}

test("allocation is exact, largest remainder first, even where a float would round", () => {
  const big = [1, 2, 3_000_000_000_000_000]
  const all = [true, true, true]
  assertLargestRemainder(Number.MAX_SAFE_INTEGER, big, all, allocateLoadCost(Number.MAX_SAFE_INTEGER, big, all))

  let seed = 7
  const next = (m) => (seed = (seed * 1103515245 + 12345) % 2147483648) % m
  for (let round = 0; round < 300; round++) {
    const n = 1 + next(12)
    const sellable = Array.from({ length: n }, () => next(4) !== 0)
    const weights = sellable.map((s) => (s ? 1 + next(500000) : next(500000)))
    const t = next(10_000_000)
    if (t > 0 && !sellable.includes(true)) continue
    assertLargestRemainder(t, weights, sellable, allocateLoadCost(t, weights, sellable))
  }
})
