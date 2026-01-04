import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stamp, Trophy } from "lucide-react"

export function MemesealHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950/20 via-background to-yellow-950/20" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* Frog mascot placeholder */}
        <div className="mb-8 animate-bounce">
          <div className="w-32 h-32 mx-auto bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500/30">
            <Stamp className="w-16 h-16 text-green-400" />
          </div>
        </div>

        {/* Badge */}
        <Badge className="mb-6 bg-green-500/10 text-green-400 border-green-500/30">
          <Trophy className="w-4 h-4 mr-2" />
          MASTER STAMPWAY APPROVES
        </Badge>

        {/* Headline */}
        <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 text-balance">
          <span className="text-foreground">MEMESEAL</span>
          <span className="text-green-400"> TON</span>
        </h1>

        <p className="text-2xl md:text-3xl text-muted-foreground mb-4 font-bold">Proof or it didn{"'"}t happen.</p>

        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty">
          One tap = on-chain proof you were early. No more "bro trust me" screenshots. Every seal feeds the lottery pot.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="https://t.me/MemeSealTON_bot" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="text-lg px-8 py-6 bg-green-500 hover:bg-green-600 text-black font-bold">
              <Stamp className="w-5 h-5 mr-2" />
              START SEALING
            </Button>
          </a>
          <a href="https://notaryton.com" target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-green-500/30 hover:border-green-500 bg-transparent"
            >
              View Lottery Pot
            </Button>
          </a>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">0.015 TON</div>
            <div className="text-sm text-muted-foreground">Per Seal</div>
          </div>
          <div className="text-center border-x border-border">
            <div className="text-3xl font-bold text-green-400 mb-2">{"<"}1 SEC</div>
            <div className="text-sm text-muted-foreground">Hash Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">5%</div>
            <div className="text-sm text-muted-foreground">Referral Forever</div>
          </div>
        </div>
      </div>
    </section>
  )
}
