import { Card } from "@/components/ui/card"
import { UserPlus, Zap, Package, Award } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    title: "Join the Gang",
    description: "Connect your Telegram account and join our exclusive community. Free to start.",
  },
  {
    icon: Zap,
    title: "Get Notified",
    description: "Receive instant alerts 15 minutes before drops go live. No bots, real members only.",
  },
  {
    icon: Package,
    title: "Claim Your Piece",
    description: "Pay with Telegram Stars or TON. Secure checkout in seconds. Limited quantities.",
  },
  {
    icon: Award,
    title: "Level Up",
    description: "Unlock higher tiers with purchases. Access rarer drops and VIP perks.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            How the <span className="text-primary">Drop Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            {
              "Our exclusivity model rewards early adopters and active community members. No luck required—just dedication."
            }
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="relative bg-card border-border p-8 hover:border-primary/50 transition-all duration-300 group"
            >
              {/* Step Number */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <step.icon className="w-8 h-8 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-serif text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-pretty leading-relaxed">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
