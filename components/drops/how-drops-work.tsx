import { Card } from "@/components/ui/card"
import { Package, DollarSign, ShoppingCart, Truck } from "lucide-react"

const steps = [
  {
    icon: Package,
    title: "We Find the Pallet",
    description:
      "We source manifested liquidation pallets from ViaTrading, B-Stock, and direct manufacturer overstock.",
  },
  {
    icon: DollarSign,
    title: "You Pre-Order",
    description: "Mystery boxes go live. You pay with Stars/TON. We only buy the pallet once funding goal is reached.",
  },
  {
    icon: ShoppingCart,
    title: "Goal Reached = We Buy",
    description:
      "Once enough boxes are pre-sold, we purchase the pallet. No inventory risk for us. Guaranteed value for you.",
  },
  {
    icon: Truck,
    title: "We Ship Your Box",
    description: "Pallet arrives, we randomly pack boxes from manifest, ship within 7-10 days. Film your unboxing!",
  },
]

export function HowDropsWork() {
  return (
    <section className="py-24 relative bg-gradient-to-b from-background to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            How <span className="text-primary">Drops Work</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            A crowdfunded liquidation model. You vote with your wallet. Once funded, we execute.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="relative bg-card/50 border-border p-8 hover:border-primary/50 transition-all duration-300 group backdrop-blur-sm"
            >
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl">
                {index + 1}
              </div>

              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <step.icon className="w-8 h-8 text-primary" />
              </div>

              <h3 className="font-serif text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-pretty leading-relaxed">{step.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="bg-card/50 border-primary/30 p-8 backdrop-blur-sm">
            <h3 className="font-serif text-2xl font-bold mb-4 text-center">
              Why This <span className="text-primary">Model Wins</span>
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Zero inventory risk</strong> - We only buy after you've
                  pre-ordered
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Transparent value</strong> - Manifested pallets = you see retail
                  prices before buying
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Community decides</strong> - Vote with your wallet on which
                  pallets to unlock
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Viral unboxings</strong> - Film your reveal, tag us, grow the
                  movement
                </span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  )
}
