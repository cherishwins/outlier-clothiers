"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Mic, MicOff, Send, Sparkles, Volume2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

interface Message {
  role: "user" | "assistant"
  content: string
  source?: "voice" | "text"
}

export function VoiceConcierge() {
  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [shouldSpeak, setShouldSpeak] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState("")
  const [liveTranscript, setLiveTranscript] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const shouldSendOnStopRef = useRef(false)
  const speechRef = useRef<any>(null)
  const speechTranscriptRef = useRef("")
  const recordingModeRef = useRef<"speech" | "media" | null>(null)

  const canUseMediaRecorder = useMemo(() => {
    if (typeof window === "undefined") return false
    return typeof window.MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia
  }, [])

  const canUseSpeechRecognition = useMemo(() => {
    if (typeof window === "undefined") return false
    const w = window as any
    return typeof w.SpeechRecognition !== "undefined" || typeof w.webkitSpeechRecognition !== "undefined"
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!shouldSpeak) return
      if (typeof window === "undefined") return
      if (!("speechSynthesis" in window)) return

      try {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.05
        utterance.pitch = 1
        window.speechSynthesis.speak(utterance)
      } catch {
        // Ignore speech errors
      }
    },
    [shouldSpeak]
  )

  const sendTextMessage = useCallback(
    async (message: string, source: Message["source"] = "text") => {
      const trimmed = message.trim()
      if (!trimmed) return
      if (isProcessing) return

      setIsProcessing(true)
      setTextInput("")

      const userMessage: Message = { role: "user", content: trimmed, source }
      const nextHistory: Message[] = [...messages, userMessage]
      setMessages(nextHistory)

      try {
        const response = await fetch("/api/ai/concierge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: nextHistory.map(({ role, content }) => ({ role, content })),
            context: { pathname },
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || "AI request failed")
        }

        const data = (await response.json()) as { reply: string }
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply, source }])
        speak(data.reply)
      } catch (error) {
        toast({
          title: "Concierge error",
          description: error instanceof Error ? error.message : "Please try again.",
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [isProcessing, messages, pathname, speak]
  )

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      if (isProcessing) return
      setIsProcessing(true)

      try {
        const formData = new FormData()
        formData.append("audio", audioBlob, "recording.webm")
        formData.append("history", JSON.stringify(messages.map(({ role, content }) => ({ role, content }))))
        formData.append("pathname", pathname)

        const response = await fetch("/api/ai/concierge/voice", {
          method: "POST",
          body: formData,
        })

        const data = (await response.json().catch(() => ({}))) as {
          transcription?: string
          reply?: string
          error?: string
        }

        if (!response.ok) {
          throw new Error(data.error || "Voice processing failed")
        }

        const transcription = (data.transcription || "").trim()
        const reply = (data.reply || "").trim()

        if (transcription) {
          setMessages((prev) => [...prev, { role: "user", content: transcription, source: "voice" }])
        }
        if (reply) {
          setMessages((prev) => [...prev, { role: "assistant", content: reply, source: "voice" }])
          speak(reply)
        }
      } catch (error) {
        toast({
          title: "Voice not available (yet)",
          description:
            error instanceof Error
              ? error.message
              : "Type your question for now. (To enable voice, set GROQ_API_KEY or OPENAI_API_KEY.)",
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [isProcessing, messages, pathname, speak]
  )

  const startRecording = useCallback(async () => {
    // Prefer native speech recognition if available (WhatsApp-style hold-to-talk, no server STT keys needed).
    if (canUseSpeechRecognition) {
      try {
        const w = window as any
        const Speech = w.SpeechRecognition || w.webkitSpeechRecognition
        const recognition = speechRef.current || new Speech()

        speechRef.current = recognition
        speechTranscriptRef.current = ""
        shouldSendOnStopRef.current = true
        setLiveTranscript("")

        recognition.lang = "en-US"
        recognition.continuous = false
        recognition.interimResults = true

        recognition.onresult = (event: any) => {
          let interim = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const text = result?.[0]?.transcript || ""
            if (result.isFinal) {
              speechTranscriptRef.current += `${text} `
            } else {
              interim += text
            }
          }
          setLiveTranscript((speechTranscriptRef.current + interim).trim())
        }

        recognition.onerror = () => {
          recordingModeRef.current = null
          setLiveTranscript(null)
          toast({
            title: "Voice recognition failed",
            description: "Type your message instead (or enable server transcription).",
          })
        }

        recognition.onend = () => {
          recordingModeRef.current = null
          setLiveTranscript(null)
          const transcript = speechTranscriptRef.current.trim()
          speechTranscriptRef.current = ""
          if (shouldSendOnStopRef.current && transcript) {
            void sendTextMessage(transcript, "voice")
          }
        }

        recordingModeRef.current = "speech"
        recognition.start()
        setIsRecording(true)
        return
      } catch {
        // Fall through to MediaRecorder approach
      }
    }

    if (!canUseMediaRecorder) {
      toast({
        title: "Microphone not supported",
        description: "Your browser can’t record audio here. Type your message instead.",
      })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      audioChunksRef.current = []
      shouldSendOnStopRef.current = true
      recordingModeRef.current = "media"

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        recordingModeRef.current = null
        if (!shouldSendOnStopRef.current) return
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await processAudio(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      toast({
        title: "Microphone blocked",
        description: "Allow microphone access, or type your message instead.",
      })
    }
  }, [canUseMediaRecorder, canUseSpeechRecognition, processAudio, sendTextMessage])

  const stopRecording = useCallback(() => {
    if (!isRecording) return

    if (recordingModeRef.current === "speech") {
      try {
        speechRef.current?.stop?.()
      } catch {
        // ignore
      }
      setIsRecording(false)
      return
    }

    if (recordingModeRef.current === "media") {
      try {
        mediaRecorderRef.current?.stop?.()
      } catch {
        // ignore
      }
      setIsRecording(false)
    }
  }, [isRecording])

  const cancelRecording = useCallback(() => {
    shouldSendOnStopRef.current = false
    if (!isRecording) return

    if (recordingModeRef.current === "speech") {
      try {
        speechRef.current?.stop?.()
      } catch {
        // ignore
      }
      recordingModeRef.current = null
      speechTranscriptRef.current = ""
      setLiveTranscript(null)
      setIsRecording(false)
      return
    }

    if (recordingModeRef.current === "media") {
      try {
        mediaRecorderRef.current?.stop?.()
      } catch {
        // ignore
      }
      setIsRecording(false)
    }
  }, [isRecording])

  // Cleanup
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel?.()
      } catch {
        // ignore
      }
    }
  }, [])

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 group"
        aria-label="Open Outlier Concierge"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl group-hover:bg-primary/40 transition-colors" />
          <div className="relative h-14 w-14 rounded-full bg-primary text-black flex items-center justify-center shadow-lg border border-primary/40 group-hover:scale-[1.03] transition-transform">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                  Outlier Concierge
                  <Badge className="bg-primary/10 text-primary border-primary/30">AI</Badge>
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask anything. Press & hold to talk like WhatsApp.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Volume2 className="h-4 w-4" />
                Speak replies
              </div>
              <Switch checked={shouldSpeak} onCheckedChange={setShouldSpeak} />
            </div>
          </DialogHeader>

          {/* Chat */}
          <div className="p-4">
            <ScrollArea className="h-[340px] pr-3">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      Try: “How does escrow + refunds work?” or “What’s the best box size for me?”
                    </p>
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={[
                        "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed border",
                        m.role === "user"
                          ? "bg-primary text-black border-primary/30"
                          : "bg-secondary/40 text-foreground border-border",
                      ].join(" ")}
                    >
                      <p>{m.content}</p>
                      {m.source && (
                        <p className="mt-1 text-[10px] opacity-70">
                          {m.source === "voice" ? "voice" : "text"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2 text-sm border bg-secondary/40 border-border text-muted-foreground">
                      Thinking…
                    </div>
                  </div>
                )}

                {isRecording && liveTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2 text-sm border bg-primary/20 text-foreground border-primary/30">
                      <p className="opacity-80">{liveTranscript}</p>
                      <p className="mt-1 text-[10px] opacity-70">listening…</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void sendTextMessage(textInput)
                    }
                  }}
                  placeholder="Type a question…"
                  disabled={isProcessing || isRecording}
                  className="bg-background"
                />
                <Button
                  onClick={() => void sendTextMessage(textInput)}
                  disabled={isProcessing || isRecording || textInput.trim().length === 0}
                  className="bg-primary hover:bg-primary/90 text-black"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {isRecording ? "Release to send" : "Hold to talk"}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onPointerDown={() => void startRecording()}
                    onPointerUp={stopRecording}
                    onPointerCancel={cancelRecording}
                    onPointerLeave={() => {
                      // If user drags away, cancel instead of sending
                      if (isRecording) cancelRecording()
                    }}
                    disabled={isProcessing}
                    className={[
                      "h-12 w-12 rounded-full p-0",
                      isRecording ? "bg-red-600 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary/90 text-black",
                    ].join(" ")}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

