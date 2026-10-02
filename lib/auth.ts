import crypto from "crypto"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Constant-time string comparison. crypto.timingSafeEqual throws when the
 * buffers differ in length, so a caller-supplied value of the wrong length
 * (a truncated signature, a multi-byte character) is a mismatch here, not a 500.
 */
export function safeEqual(presented: string, expected: string): boolean {
  const a = Buffer.from(presented)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Gate for operator-only routes: `Authorization: Bearer <ADMIN_TOKEN>`.
 * Fails closed: with ADMIN_TOKEN unset the route is switched off (503), never
 * open. Returns the response to send when the caller is not the operator, or
 * null when they are.
 */
export function requireAdminToken(request: NextRequest): NextResponse | null {
  const token = process.env.ADMIN_TOKEN
  if (!token) {
    return NextResponse.json({ error: "Admin API is not enabled" }, { status: 503 })
  }

  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "")
  if (!match || !safeEqual(match[1], token)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    )
  }

  return null
}
