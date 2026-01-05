import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateConciergeReply, type ChatMessage } from "@/lib/ai-gateway"

const HistorySchema = z.array(
  z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
  })
)

async function transcribeWithOpenAI(audioBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")

  const formData = new FormData()
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType || "audio/webm" })
  formData.append("file", audioBlob, "audio.webm")
  formData.append("model", "whisper-1")
  formData.append("language", "en")

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text().catch(() => "")
    throw new Error(`OpenAI transcription failed (${response.status}): ${error || response.statusText}`)
  }

  const data = (await response.json()) as { text?: string }
  const text = (data.text || "").trim()
  if (!text) throw new Error("OpenAI transcription returned empty text")
  return text
}

async function transcribeWithGroq(audioBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured")

  const formData = new FormData()
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType || "audio/webm" })
  formData.append("file", audioBlob, "audio.webm")
  formData.append("model", "whisper-large-v3")

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text().catch(() => "")
    throw new Error(`Groq transcription failed (${response.status}): ${error || response.statusText}`)
  }

  const data = (await response.json()) as { text?: string }
  const text = (data.text || "").trim()
  if (!text) throw new Error("Groq transcription returned empty text")
  return text
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 })
    }

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File | null
    const historyJson = formData.get("history") as string | null
    const pathname = (formData.get("pathname") as string | null) || undefined

    if (!audioFile) {
      return NextResponse.json({ error: "audio file required" }, { status: 400 })
    }

    let history: ChatMessage[] = []
    if (historyJson) {
      try {
        history = HistorySchema.parse(JSON.parse(historyJson)) as ChatMessage[]
      } catch {
        history = []
      }
    }

    const audioBuffer = await audioFile.arrayBuffer()

    let transcription: string
    if (process.env.GROQ_API_KEY) {
      transcription = await transcribeWithGroq(audioBuffer, audioFile.type)
    } else if (process.env.OPENAI_API_KEY) {
      transcription = await transcribeWithOpenAI(audioBuffer, audioFile.type)
    } else {
      return NextResponse.json(
        { error: "No transcription API configured (set GROQ_API_KEY or OPENAI_API_KEY)" },
        { status: 500 }
      )
    }

    const result = await generateConciergeReply({
      message: transcription,
      history,
      context: {
        pathname,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
        isTestnet: process.env.NEXT_PUBLIC_TESTNET === "true",
      },
    })

    return NextResponse.json({
      transcription,
      reply: result.text,
      model: result.model,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[AI Concierge Voice] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

