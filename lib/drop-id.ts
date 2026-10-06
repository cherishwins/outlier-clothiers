/**
 * A FlashCargo drop id from untrusted input (a query string, a JSON body, a
 * webhook's metadata). The contract numbers drops from 0, so 0 is the first
 * drop, not a missing value: callers must not default an absent id to 0.
 *
 * Accepts a non-negative safe integer, as a number or as a string of decimal
 * digits. Everything else (absent, empty, negative, fractional, "1e3", " 7",
 * "0x1") is null.
 */
export function parseDropId(value: unknown): number | null {
  if (typeof value === "number") {
    // Math.abs only turns -0 into 0 here.
    return Number.isSafeInteger(value) && value >= 0 ? Math.abs(value) : null
  }
  if (typeof value === "string" && /^[0-9]{1,15}$/.test(value)) {
    return Number(value)
  }
  return null
}
