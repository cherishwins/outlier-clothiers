import { Card } from "@/components/ui/card"
import { TrendingUp, Tv, DollarSign } from "lucide-react"

export function MemesealCasino() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            COMING NEXT: THE <span className="text-green-400">FROG CASINO</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Master Stampway{"'"}s grand vision. The frog gambles. You win.
          </p>
          <div className="mt-6">
            <span className="text-sm bg-green-500/10 text-green-400 border border-green-500/30 px-4 py-2 rounded-full">
              LAUNCHING Q1 2026 | EARLY SEALERS GET PRIORITY ACCESS + FREE SPINS
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-card border-border p-6 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="font-bold text-xl mb-2">Event Coins</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              $FROGTRUMP price tracks real election odds. $FROGWEATHER tracks tomorrow{"'"}s temp. Rake feeds the pot.
              Bet on reality.
            </p>
          </Card>

          <Card className="bg-card border-border p-6 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Tv className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="font-bold text-xl mb-2">Weekly Live Show</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Puppet frogs roast the news, then we draw the lottery winner on stream. Degen entertainment meets real
              money.
            </p>
          </Card>

          <Card className="bg-card border-border p-6 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="font-bold text-xl mb-2">Politician Slots</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Slots where politicians are the reels. Trump hair = 100x wild. Biden stumble = free spin. Nancy = insider
              multiplier.
            </p>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-2xl font-bold text-green-400">SEAL NOW → STACK TICKETS</p>
        </div>
      </div>
    </section>
  )
}
