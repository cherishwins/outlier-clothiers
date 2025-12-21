import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Diamond, Medal, Star } from "lucide-react"

const tiers = [
  {
    name: "Bronze",
    icon: Medal,
    price: "Free",
    requirement: "Join waitlist",
    color: "text-amber-700",
    bgColor: "bg-amber-700/10",
    borderColor: "border-amber-700/20",
    benefits: [
      "Access to public drops",
      "Telegram community access",
      "Drop notifications 5min early",
      "5% cashback in Stars",
    ],
  },
  {
    name: "Gold",
    icon: Star,
    price: "500 Stars",
    requirement: "Or 1 purchase",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    benefits: [
      "All Bronze benefits",
      "Access to Gold-tier drops",
      "Drop notifications 15min early",
      "10% cashback in Stars",
      "Exclusive Telegram channel",
    ],
    popular: true,
  },
  {
    name: "Platinum",
    icon: Crown,
    price: "2,500 Stars",
    requirement: "Or 3 purchases",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/30",
    benefits: [
      "All Gold benefits",
      "Access to Platinum drops",
      "Drop notifications 30min early",
      "15% cashback in Stars",
      "Priority support",
      "Member-only events",
    ],
  },
  {
    name: "Diamond",
    icon: Diamond,
    price: "Invite Only",
    requirement: "Top 50 members",
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "border-violet-400/30",
    benefits: [
      "All Platinum benefits",
      "Access to Diamond drops",
      "1-hour early access",
      "20% cashback in Stars",
      "Guaranteed allocation",
      "Co-design opportunities",
      "Annual exclusive merch",
    ],
  },
]

export function MemberTiers() {
  return (
    <section className="py-24 relative bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            Member <span className="text-primary">Tiers</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            {
              "Climb the ranks to unlock exclusive drops, earlier access, and premium perks. Your commitment earns rewards."
            }
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative bg-card ${tier.borderColor} border-2 p-6 hover:scale-105 transition-all duration-300 ${
                tier.popular ? "ring-2 ring-primary shadow-lg shadow-primary/20" : ""
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}

              {/* Icon */}
              <div className={`w-16 h-16 ${tier.bgColor} rounded-lg flex items-center justify-center mb-6 mx-auto`}>
                <tier.icon className={`w-8 h-8 ${tier.color}`} />
              </div>

              {/* Tier Name */}
              <h3 className={`font-serif text-2xl font-bold text-center mb-2 ${tier.color}`}>{tier.name}</h3>

              {/* Pricing */}
              <div className="text-center mb-2">
                <div className="text-2xl font-bold">{tier.price}</div>
                <div className="text-sm text-muted-foreground">{tier.requirement}</div>
              </div>

              <div className="h-px bg-border my-6" />

              {/* Benefits */}
              <ul className="space-y-3 mb-6">
                {tier.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 ${tier.color} mt-0.5 flex-shrink-0`} />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={`w-full ${
                  tier.popular
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {tier.price === "Free" ? "Start Free" : tier.price === "Invite Only" ? "Learn More" : "Upgrade"}
              </Button>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            {
              "Tiers are permanent once unlocked. All payments in Telegram Stars or TON. Cashback applied automatically to your Telegram account."
            }
          </p>
        </div>
      </div>
    </section>
  )
}
