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
    description: "Mystery boxes go live. You pay with Stars, USDC or card. We only buy the pallet once the funding goal is reached.",
  },
  {
    icon: ShoppingCart,
    title: "Goal Reached = We Buy",
    description:
      "Once enough boxes are pre-sold before the deadline, we purchase the pallet. If not, deposits are refundable from the escrow contract.",
  },
  {
    icon: Truck,
    title: "We Ship Your Box",
    description: "Pallet arrives, we pack boxes at random from the manifest and ship them. Film your unboxing!",
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
              What to <span className="text-primary">Know</span>
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Pre-order first</strong> - We only buy a load after its drop is
                  funded
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Random contents</strong> - Each drop links its load&apos;s
                  manifest, but what is in your box, and what it is worth, varies
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Escrowed</strong> - Each box is a slot in the FlashCargo
                  contract; a drop that is cancelled or not released by its deadline is refundable from it
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
