import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function JucheAccess() {
  const benefits = [
    "Early word on new pallet drops",
    "Private Telegram channel with manifest previews",
    "Reseller playbook & arbitrage strategies",
  ]

  return (
    <section id="member-perks" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border-primary/30 border-2 p-10">
            <div className="text-center mb-8">
              <h2 className="font-serif text-4xl font-bold mb-4">
                VIP <span className="text-primary">Access</span>
              </h2>
              <p className="text-muted-foreground">For resellers and arbitrage players. Membership is by application on Telegram.</p>
            </div>

            <ul className="space-y-3 mb-8">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <a href="https://t.me/JucheGang" target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6">
                Apply on Telegram
              </Button>
            </a>
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
