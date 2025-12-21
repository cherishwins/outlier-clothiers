import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Boxes, TrendingUp } from "lucide-react"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <Image
            src="/images/wordmark.png"
            alt="JUCHE GANG"
            width={500}
            height={140}
            className="mx-auto mb-6"
            priority
          />
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            LUXURY SURPLUS <span className="text-primary">LIQUIDATION</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We buy canceled orders, overstock, and manufacturer surplus from luxury Chinese factories. You get 80% off
            retail. Factory gets tax write-offs. Everyone wins.
          </p>
        </div>

        {/* Three options */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/drops">
            <Card className="bg-card border-border p-8 hover:border-primary/50 transition-all cursor-pointer group h-full">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                MYSTERY DROPS
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Pre-order mystery boxes before we buy the pallet. Manifested inventory. Zero risk for us. Treasure hunt
                for you.
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90">Browse Drops →</Button>
            </Card>
          </Link>

          <Link href="/pallets">
            <Card className="bg-card border-border p-8 hover:border-green-500/50 transition-all cursor-pointer group h-full">
              <div className="w-16 h-16 bg-green-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors">
                <Boxes className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-3 group-hover:text-green-400 transition-colors">
                ACTIVE PALLETS
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                See what pallets are funding right now. Vote with your wallet. Once funded, we buy and ship.
              </p>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-black">View Pallets →</Button>
            </Card>
          </Link>

          <Link href="/juche">
            <Card className="bg-card border-border p-8 hover:border-primary/50 transition-all cursor-pointer group h-full">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                JUCHE GANG
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                VIP network for resellers and builders. Get early pallet access, bulk pricing, and member-only deals.
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90">Join Gang →</Button>
            </Card>
          </Link>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground space-y-2">
          <p className="font-bold text-foreground">How we beat the luxury markup scam:</p>
          <p>
            Factory overproduces 10,000 Hugo Boss suits → Order gets canceled → They need to liquidate fast → We buy at
            15% of wholesale → You get 80% off retail
          </p>
          <p className="text-xs">All powered by Telegram Stars & TON. No credit cards. No middlemen.</p>
        </div>
      </div>
    </main>
  )
}
