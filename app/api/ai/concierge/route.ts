import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateConciergeReply } from "@/lib/ai-gateway"

const BodySchema = z.object({
  message: z.string().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .optional(),
  context: z
    .object({
      pathname: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = BodySchema.parse(await request.json())

    const result = await generateConciergeReply({
      message: body.message,
      history: body.history,
      context: {
        pathname: body.context?.pathname,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
        isTestnet: process.env.NEXT_PUBLIC_TESTNET === "true",
      },
    })

    return NextResponse.json({
      reply: result.text,
      model: result.model,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[AI Concierge] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

