import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap } from "lucide-react"

export function MemesealPricing() {
  const plans = [
    {
      name: "Pay As You Go",
      price: "1",
      unit: "STAR",
      altPrice: "0.015 TON",
      features: [
        "Single seal",
        "Instant on-chain proof",
        "Permanent verify link",
        "1 lottery ticket per seal",
        "Perfect for 47 coins before breakfast",
      ],
    },
    {
      name: "Unlimited Monthly",
      price: "20",
      unit: "STARS",
      altPrice: "0.3 TON",
      features: [
        "Unlimited seals",
        "API access included",
        "Batch operations",
        "20 lottery tickets/month",
        "For real cookers who launch daily",
      ],
      popular: true,
    },
  ]

  return (
    <section className="py-24 relative bg-gradient-to-b from-background to-green-950/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            DEGEN <span className="text-green-400">PRICING</span>
          </h2>
          <p className="text-muted-foreground">
            no subscription bullshit unless you want it | every payment feeds the lottery
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`bg-card border-2 p-8 ${
                plan.popular ? "border-green-500 ring-2 ring-green-500/20" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="text-center mb-4">
                  <span className="inline-block bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    FOR COOKERS
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="font-bold text-2xl mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <Star className="w-6 h-6 text-primary fill-primary" />
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-xl text-muted-foreground">{plan.unit}</span>
                </div>
                <div className="text-sm text-muted-foreground">or {plan.altPrice}</div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.popular
                    ? "bg-green-500 hover:bg-green-600 text-black font-bold"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                <Zap className="w-4 h-4 mr-2" />
                {plan.popular ? "Start Cooking" : "Get Started"}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            5% referral kickback forever. Integrate the API into your pump clone and print passive income szn.
          </p>
        </div>
      </div>
    </section>
  )
}
