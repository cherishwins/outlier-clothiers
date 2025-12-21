import { Card } from "@/components/ui/card"
import { Shield, Eye, Zap } from "lucide-react"

export function TacticalMission() {
  return (
    <section className="py-24 relative bg-black">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-12 text-center text-balance">
            Why We <span className="text-primary">Exist</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Shield,
                title: "Privacy is a Right",
                description: "Not a luxury. We make operational security accessible to everyone who values freedom.",
              },
              {
                icon: Eye,
                title: "Eyes Everywhere",
                description:
                  "Surveillance capitalism is real. Protect yourself with tools the powerful don't want you to have.",
              },
              {
                icon: Zap,
                title: "Act Now",
                description:
                  "Waiting for governments to protect privacy? Keep waiting. Take control with hardware you own.",
              },
            ].map((item) => (
              <Card key={item.title} className="bg-card/50 border-border p-6 text-center backdrop-blur-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              We ship worldwide with anonymous packaging. Pay with TON or Stars only. No credit cards. No data trails.
              Your security is our mission.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
