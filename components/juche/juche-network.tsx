import { Card } from "@/components/ui/card"
import { Code, TrendingUp, Sparkles, Rocket } from "lucide-react"

export function JucheNetwork() {
  const profiles = [
    {
      icon: Code,
      role: "AI Engineer",
      description: "Built a 7-figure AI automation agency. Helps members implement AI in their businesses.",
    },
    {
      icon: TrendingUp,
      role: "Crypto Trader",
      description: "8-figure portfolio. Shares alpha on TON ecosystem. Early to every major pump.",
    },
    {
      icon: Sparkles,
      role: "Content Creator",
      description: "420K followers. Monetizes attention. Teaches members how to build personal brands.",
    },
    {
      icon: Rocket,
      role: "SaaS Founder",
      description: "$50K MRR in 9 months. No funding. Shares growth playbooks with members.",
    },
  ]

  return (
    <section className="py-24 relative bg-gradient-to-b from-black to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            The <span className="text-primary">Network</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You are the average of the 5 people you spend the most time with. Choose wisely.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {profiles.map((profile) => (
            <Card
              key={profile.role}
              className="bg-card/50 border-border p-6 hover:border-primary/50 transition-all backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <profile.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{profile.role}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            These are just 4 of 500 members. Everyone brings unique skills. Everyone helps everyone else win.
          </p>
        </div>
      </div>
    </section>
  )
}
