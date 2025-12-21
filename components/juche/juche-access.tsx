import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Star } from "lucide-react"

export function JucheAccess() {
  const benefits = [
    "24-hour early access to all pallet drops",
    "30% discount on bulk mystery box orders (10+ boxes)",
    "Private Telegram channel with manifest previews",
    "Member-only wholesale liquidation deals",
    "Direct sourcing contacts in China (vetted suppliers)",
    "Reseller playbook & arbitrage strategies",
    "Monthly liquidation webinars with 6-7 figure flippers",
  ]

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border-primary/30 border-2 p-10">
            <div className="text-center mb-8">
              <h2 className="font-serif text-4xl font-bold mb-4">
                VIP <span className="text-primary">Access</span>
              </h2>
              <p className="text-muted-foreground">
                For serious resellers and arbitrage players only. Limited to 200 members.
              </p>
            </div>

            <div className="mb-8">
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-primary fill-primary" />
                  <span className="text-5xl font-bold text-primary">2,500</span>
                  <span className="text-xl text-muted-foreground">STARS/mo</span>
                </div>
                <div className="text-sm text-muted-foreground">or 90 TON/mo (~$300)</div>
              </div>

              <ul className="space-y-3 mb-8">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6">
                Join JUCHE GANG
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Pays for itself in one bulk order. Cancel anytime. No BS contracts.</p>
            </div>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              For flippers, resellers, and arbitrage hustlers who treat this like a real business.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
