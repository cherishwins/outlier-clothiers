import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

// Liveness and readiness in one: the process answers, and the Postgres the
// store depends on answers too. Used by the container HEALTHCHECK and any
// uptime monitor. Kept dynamic so it never gets cached into a static answer.
export const dynamic = "force-dynamic"

// One client for the module (the module is cached), guarded on globalThis so
// Next's dev HMR does not open a new pool on every reload.
const globalForPrisma = globalThis as unknown as { healthPrisma?: PrismaClient }
const prisma = globalForPrisma.healthPrisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.healthPrisma = prisma

export async function GET() {
  const started = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json(
      { status: "healthy", database: "ok", latencyMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return NextResponse.json(
      { status: "unhealthy", database: "unreachable", latencyMs: Date.now() - started },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
