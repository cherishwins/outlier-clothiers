import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, DollarSign, ShoppingCart, Package, Truck, Star } from "lucide-react"

const timeline = [
  {
    icon: Search,
    title: "Day 1: We Find the Pallet",
    description: "Browse ViaTrading, B-Stock, Liquidation.com for manifested luxury overstock",
  },
  {
    icon: DollarSign,
    title: "Day 1-7: Funding Period",
    description: "List it as a drop. You pre-order mystery boxes. We track funding progress live.",
  },
  {
    icon: ShoppingCart,
    title: "Day 7: Funding Goal Hit",
    description: "Once we hit 100% funding, we immediately purchase the pallet from source.",
  },
  {
    icon: Package,
    title: "Day 8-10: Import & Pack",
    description: "Pallet arrives at our warehouse. We randomly pack mystery boxes from manifest items.",
  },
  {
    icon: Truck,
    title: "Day 11-14: Ship & Deliver",
    description: "All boxes ship out. You receive tracking. 7-10 days total turnaround.",
  },
  {
    icon: Star,
    title: "Day 15+: Unbox & Review",
    description: "Film your unboxing. Tag us. Share the value you got. Repeat customers get perks.",
  },
]

export function PalletTimeline() {
  return (
    <section className="py-24 relative bg-gradient-to-b from-background to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            Pallet <span className="text-primary">Timeline</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            From discovery to delivery: the full 14-day journey of a liquidation pallet drop.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {timeline.map((step, index) => (
            <div key={index} className="relative">
              {index < timeline.length - 1 && (
                <div className="absolute left-8 top-20 h-full w-0.5 bg-gradient-to-b from-primary/50 to-transparent" />
              )}

              <Card className="bg-card/50 border-border p-6 mb-6 hover:border-primary/50 transition-all backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="bg-card/50 border-primary/30 p-8 backdrop-blur-sm text-center">
            <h3 className="font-serif text-2xl font-bold mb-4">
              Questions? <span className="text-primary">We're Transparent</span>
            </h3>
            <p className="text-muted-foreground mb-6">
              Join our Telegram community to see past unboxings, ask questions, and see exactly how we operate. No
              secrets. No BS.
            </p>
            <Button className="bg-primary hover:bg-primary/90">Join Telegram Community</Button>
          </Card>
        </div>
      </div>
    </section>
  )
}
