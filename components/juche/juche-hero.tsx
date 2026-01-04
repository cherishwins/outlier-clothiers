import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, TrendingUp, Users } from "lucide-react"
import Image from "next/image"

export function JucheHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent_70%)]" />

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <Image
            src="/images/jpanda-geo-512.png"
            alt="JUCHE GANG"
            width={120}
            height={120}
            className="mx-auto opacity-80"
            priority
          />
        </div>

        <Badge className="mb-6 bg-primary/10 text-primary border-primary/30">
          <Crown className="w-4 h-4 mr-2" />
          VIP RESELLER NETWORK
        </Badge>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-balance">
          <span className="text-primary">JUCHE</span>
          <br />
          <span className="text-foreground">GANG</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty leading-relaxed">
          The VIP network for resellers, flippers, and arbitrage hustlers. Get early pallet access, bulk pricing, and
          member-only liquidation deals. Self-reliance means buying smart, not buying expensive.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="https://t.me/JucheGang" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              <TrendingUp className="w-5 h-5 mr-2" />
              Apply for VIP Access
            </Button>
          </a>
          <a href="#member-perks">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-primary/30 hover:border-primary hover:bg-primary/10 bg-transparent"
            >
              <Users className="w-5 h-5 mr-2" />
              See Member Perks
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{"<200"}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">VIP Members</div>
          </div>
          <div className="text-center border-x border-border">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">30%</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Extra Discount</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24h</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Early Access</div>
          </div>
        </div>
      </div>
    </section>
  )
}
