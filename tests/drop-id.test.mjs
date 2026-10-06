// npm test  (node --test; Node 22.18+ strips the types from the .ts import)
import assert from "node:assert/strict"
import { test } from "node:test"

import { parseDropId } from "../lib/drop-id.ts"

test("drop 0 is the contract's first drop", () => {
  assert.equal(parseDropId(0), 0)
  assert.equal(parseDropId("0"), 0)
  assert.ok(Object.is(parseDropId(-0), 0))
})

test("accepts non-negative integers as numbers or digit strings", () => {
  assert.equal(parseDropId(1), 1)
  assert.equal(parseDropId("42"), 42)
  assert.equal(parseDropId("007"), 7)
  assert.equal(parseDropId(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER)
})

test("rejects absent, negative, fractional and non-decimal input", () => {
  for (const bad of [
    undefined, null, "", " ", " 7", "7 ", "-1", -1, 1.5, "1.5", "1e3", "0x1",
    NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "9999999999999999", true, {}, [], [1],
  ]) {
    assert.equal(parseDropId(bad), null, `expected null for ${JSON.stringify(bad)}`)
  }
})
