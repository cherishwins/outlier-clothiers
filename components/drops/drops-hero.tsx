import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function DropsHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent_70%)]" />

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/images/wordmark.png"
            alt="JUCHE GANG"
            width={400}
            height={120}
            className="mx-auto opacity-90 hover:opacity-100 transition-opacity"
            priority
          />
        </Link>

        <Badge className="mb-6 bg-primary/10 text-primary border-primary/30">
          <Package className="w-4 h-4 mr-2" />
          MYSTERY LIQUIDATION DROPS
        </Badge>

        <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 text-balance">
          <span className="text-primary">TREASURE HUNT</span>
          <br />
          <span className="text-foreground">AT 80% OFF</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty leading-relaxed">
          We source liquidation pallets from canceled luxury orders. You pre-order mystery boxes. Once funded, we buy
          the pallet and ship your box. Manifested inventory = you know the value range.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="#active-drops">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Package className="w-5 h-5 mr-2" />
              Browse Active Drops
            </Button>
          </a>
          <a href="https://t.me/OutlierClothiersBot" target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-primary/30 hover:border-primary hover:bg-primary/10 bg-transparent"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              See Past Unboxings
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">80%</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Below Retail</div>
          </div>
          <div className="text-center border-x border-border">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Inventory Risk</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Manifested</div>
          </div>
        </div>
      </div>
    </section>
  )
}
