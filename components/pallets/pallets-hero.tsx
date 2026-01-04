import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Boxes, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function PalletsHero() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
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

        <Badge className="mb-6 bg-green-500/10 text-green-400 border-green-500/30">
          <Boxes className="w-4 h-4 mr-2" />
          LIVE PALLET FUNDING
        </Badge>

        <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 text-balance">
          <span className="text-primary">ACTIVE PALLETS</span>
          <br />
          <span className="text-foreground">FUND & PROFIT</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty leading-relaxed">
          See which liquidation pallets are funding right now. Back the ones you believe in. Once funded, we buy and
          fulfill. Transparent. Community-driven. No BS.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8 py-6 bg-green-500 hover:bg-green-600 text-black">
            <TrendingUp className="w-5 h-5 mr-2" />
            View Funding Pallets
          </Button>
        </div>
      </div>
    </section>
  )
}
