const DEFAULT_BASE_URL = "https://ai-gateway.vercel.sh/v3/ai"

export const AI_MODELS = {
  fast: "xai/grok-4.1-fast-non-reasoning",
  reasoning: "xai/grok-4.1-fast-reasoning",
  vision: "xai/grok-4.1-vision",
  gemini: "google/gemini-2.0-flash",
  claude: "anthropic/claude-3-5-haiku",
} as const

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ConciergeContext {
  pathname?: string
  appUrl?: string
  isTestnet?: boolean
}

export interface ConciergeReply {
  text: string
  model: string
}

export async function generateConciergeReply(params: {
  message: string
  history?: ChatMessage[]
  context?: ConciergeContext
}): Promise<ConciergeReply> {
  const apiKey = process.env.AI_GATEWAY_API_KEY
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY is not configured")
  }

  const baseUrl = process.env.AI_GATEWAY_BASE_URL || DEFAULT_BASE_URL
  const model = process.env.AI_GATEWAY_MODEL || AI_MODELS.fast

  const history = (params.history || []).slice(-20)
  const systemPrompt = buildSystemPrompt(params.context)

  const prompt = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m) =>
      m.role === "user"
        ? {
            role: "user" as const,
            content: [{ type: "text" as const, text: m.content }],
          }
        : {
            role: "assistant" as const,
            content: [{ type: "text" as const, text: m.content }],
          }
    ),
    {
      role: "user" as const,
      content: [{ type: "text" as const, text: params.message }],
    },
  ]

  const response = await fetch(`${withoutTrailingSlash(baseUrl)}/language-model`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "ai-gateway-protocol-version": "0.0.1",
      "ai-gateway-auth-method": "api-key",
      "ai-language-model-specification-version": "2",
      "ai-language-model-id": model,
      "ai-language-model-streaming": "false",
    },
    body: JSON.stringify({
      prompt,
      temperature: 0.4,
      maxOutputTokens: 220,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`AI Gateway error (${response.status}): ${text || response.statusText}`)
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>
  }

  const text = (data.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text || "")
    .join("")
    .trim()

  if (!text) {
    throw new Error("AI Gateway returned empty response")
  }

  return { text, model }
}

function buildSystemPrompt(context?: ConciergeContext): string {
  const appUrl = context?.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://outlierclothiers.com"
  const isTestnet =
    typeof context?.isTestnet === "boolean"
      ? context.isTestnet
      : process.env.NEXT_PUBLIC_TESTNET === "true"

  return [
    "You are the Outlier Clothiers Concierge.",
    "You help users understand drops, escrow, payments, and shipping.",
    "",
    "Rules:",
    "- Be concise and confident.",
    "- If asked about payments: mention Coinbase Commerce, x402 (USDC on Base), and Telegram Stars.",
    "- If asked about safety: explain escrow + auto-refund if threshold not met.",
    "- Never claim something is live unless the user confirms it.",
    "",
    `Context:`,
    `- App: ${appUrl}`,
    `- Network mode: ${isTestnet ? "testnet" : "mainnet"}`,
    context?.pathname ? `- Page: ${context.pathname}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

function withoutTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

