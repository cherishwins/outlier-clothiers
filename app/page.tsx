"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, Boxes, Crown, Zap, Shield, Globe, ChevronDown } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

function GlowingOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-[100px] animate-pulse ${className}`} />
  )
}

function FloatingParticle({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="absolute w-1 h-1 bg-primary/60 rounded-full animate-float"
      style={{
        animationDelay: `${delay}s`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`
      }}
    />
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Gold gradient orbs */}
          <GlowingOrb className="w-[600px] h-[600px] bg-primary/20 top-[-200px] left-[-200px]" />
          <GlowingOrb className="w-[500px] h-[500px] bg-primary/15 bottom-[-100px] right-[-100px] animation-delay-1000" />
          <GlowingOrb className="w-[300px] h-[300px] bg-primary/10 top-[40%] right-[20%] animation-delay-2000" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />

          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background" />
        </div>

        {/* Main Content */}
        <div className={`relative z-10 text-center px-4 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Panda Logo */}
          <div className="relative mb-8">
            <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full scale-50" />
            <Image
              src="/images/logo.png"
              alt="OUTLIER CLOTHIERS"
              width={280}
              height={280}
              className="relative mx-auto drop-shadow-[0_0_50px_rgba(212,175,55,0.5)] hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>

          {/* Brand Name */}
          <h1 className="font-bold tracking-[-0.02em] mb-2">
            <span className="block text-6xl md:text-8xl lg:text-9xl bg-gradient-to-b from-primary via-primary to-primary/60 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              OUTLIER
            </span>
            <span className="block text-2xl md:text-3xl lg:text-4xl tracking-[0.3em] text-foreground/90 mt-2">
              CLOTHIERS
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-primary/80 font-light tracking-wide mt-6 mb-4">
            LUXURY SURPLUS LIQUIDATION
          </p>

          <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed mb-12">
            80% off retail. Factory overstock. Zero middlemen.
            <br />
            <span className="text-primary/60">Pay with Telegram Stars or TON.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/drops">
              <Button
                size="lg"
                className="text-lg px-10 py-7 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-black font-bold shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] transition-all duration-300 group"
              >
                <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                SHOP DROPS
              </Button>
            </Link>
            <Link href="/juche">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-7 border-2 border-primary/50 hover:border-primary hover:bg-primary/10 text-foreground font-bold transition-all duration-300"
              >
                <Crown className="w-5 h-5 mr-2" />
                JOIN GANG
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold text-primary group-hover:scale-110 transition-transform">80%</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Off Retail</div>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden md:block" />
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold text-primary group-hover:scale-110 transition-transform">0</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Risk Model</div>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden md:block" />
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold text-primary group-hover:scale-110 transition-transform">∞</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Self-Reliance</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-primary/50" />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="text-primary">HOW</span> IT WORKS
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            We flip the luxury game. Factories overproduce. Orders get canceled. We buy the surplus. You get designer goods at wholesale prices.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "WE FIND", desc: "Liquidation pallets from ViaTrading, B-Stock, factory surplus", icon: Globe },
              { step: "02", title: "YOU FUND", desc: "Pre-order mystery boxes before we buy. See the manifest.", icon: Package },
              { step: "03", title: "WE BUY", desc: "Once funded, we purchase. Zero inventory risk.", icon: Shield },
              { step: "04", title: "YOU WIN", desc: "Get 80% off retail. Shipped in 7-10 days.", icon: Zap },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 rounded-2xl p-8 transition-all duration-300 hover:translate-y-[-4px]">
                  <div className="text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                  <item.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three Paths Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            CHOOSE YOUR <span className="text-primary">PATH</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            Three ways to score. Pick your play.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mystery Drops */}
            <Link href="/drops" className="group">
              <div className="relative h-full bg-gradient-to-b from-card to-card/50 border border-border hover:border-primary rounded-3xl p-10 transition-all duration-500 hover:shadow-[0_0_60px_rgba(212,175,55,0.15)] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />

                <Package className="w-14 h-14 text-primary mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">MYSTERY DROPS</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Treasure hunt vibes. Pre-order mystery boxes packed with manifested luxury goods. Every box is a win.
                </p>
                <div className="flex items-center text-primary font-semibold">
                  Browse Drops
                  <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Active Pallets */}
            <Link href="/pallets" className="group">
              <div className="relative h-full bg-gradient-to-b from-card to-card/50 border border-border hover:border-green-500 rounded-3xl p-10 transition-all duration-500 hover:shadow-[0_0_60px_rgba(34,197,94,0.15)] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-colors" />

                <Boxes className="w-14 h-14 text-green-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-3xl font-bold mb-4 group-hover:text-green-500 transition-colors">ACTIVE PALLETS</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Real-time funding. See exactly what pallet we&apos;re buying. Watch progress. Vote with your wallet.
                </p>
                <div className="flex items-center text-green-500 font-semibold">
                  View Pallets
                  <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Juche Gang */}
            <Link href="/juche" className="group">
              <div className="relative h-full bg-gradient-to-b from-card to-card/50 border border-border hover:border-primary rounded-3xl p-10 transition-all duration-500 hover:shadow-[0_0_60px_rgba(212,175,55,0.15)] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />

                <Crown className="w-14 h-14 text-primary mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">JUCHE GANG</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  VIP network for resellers and builders. Early access. Bulk pricing. Member-only deals. Self-reliance.
                </p>
                <div className="flex items-center text-primary font-semibold">
                  Join Gang
                  <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            READY TO <span className="text-primary">WIN</span>?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join the Telegram. Get first access to drops. Build with us.
          </p>

          <a href="https://t.me/OutlierClothiersBot" target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="text-xl px-12 py-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-black font-bold shadow-[0_0_50px_rgba(212,175,55,0.5)] hover:shadow-[0_0_80px_rgba(212,175,55,0.7)] transition-all duration-300"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.423-.168.564-.505 1.074-.996 1.074-.853 0-1.195-.79-1.856-1.247-.938-.647-1.469-1.05-2.381-1.682-.105-.073-.241-.18-.241-.314 0-.18.165-.285.285-.375.96-.717 2.222-1.983 2.402-2.167.18-.18.045-.285-.135-.18-.646.42-2.927 1.86-3.48 2.205-.553.345-1.05.511-1.86.27-.855-.255-1.673-.527-2.235-.707-.39-.12-.855-.36-.75-.735.045-.18.315-.36.63-.54C6.952 8.558 9.48 7.41 14.325 5.43c.495-.195 2.7-1.125 2.775-.045.03.405-.135 1.695-.538 2.776z"/>
              </svg>
              JOIN TELEGRAM
            </Button>
          </a>

          <p className="mt-8 text-sm text-muted-foreground">
            Pay with <span className="text-primary">Telegram Stars</span> • <span className="text-primary">TON</span> • <span className="text-primary">USDC</span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="Logo" width={40} height={40} />
            <span className="font-bold text-primary">OUTLIER CLOTHIERS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built by JUCHE GANG. Self-reliant. Future-focused.
          </p>
        </div>
      </footer>
    </main>
  )
}
