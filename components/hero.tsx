"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Clock } from "lucide-react"
import Image from "next/image"
import { CountdownTimer } from "./countdown-timer"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background z-0" />

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <Image
            src="/wordmark.png"
            alt="JUCHE GANG"
            width={600}
            height={200}
            className="w-full max-w-2xl h-auto"
            priority
          />
        </div>

        {/* Tagline */}
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-balance animate-fade-in animation-delay-200">
          <span className="text-foreground">Creation Without</span>
          <br />
          <span className="text-primary">Limitation</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty animate-fade-in animation-delay-400">
          {
            "Exclusive streetwear drops for the Telegram generation. Limited quantities. Premium quality. Accept Stars & TON."
          }
        </p>

        {/* Next Drop Countdown */}
        <div className="mb-12 animate-fade-in animation-delay-600">
          <div className="inline-block bg-card border border-primary/20 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm uppercase tracking-wider text-muted-foreground">Next Drop In</span>
            </div>
            <CountdownTimer targetDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} />
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in animation-delay-800">
          <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground group">
            <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
            Join Waitlist
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 border-primary/30 hover:border-primary hover:bg-primary/10 bg-transparent"
          >
            View Collection
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20 animate-fade-in animation-delay-1000">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{"<100"}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Items Per Drop</div>
          </div>
          <div className="text-center border-x border-border">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">2.8K+</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Waitlist Members</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{"<5min"}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Avg. Sellout Time</div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
