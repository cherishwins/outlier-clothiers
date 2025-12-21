import { Card } from "@/components/ui/card"
import { Upload, Zap, Link2, TrendingUp } from "lucide-react"

export function MemesealHowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: "Upload Anything",
      description: "Screenshot of your trade, wallet connect, voice note, contract address. Whatever needs proof.",
    },
    {
      icon: Zap,
      title: "Instant Hash",
      description: "Under 1 second. Your content gets sealed on TON blockchain forever. Master Stampway approves.",
    },
    {
      icon: Link2,
      title: "Permanent Link",
      description:
        "Anyone can verify. No login, no KYC. Just paste the hash and see the proof. Even your ex can verify.",
    },
    {
      icon: TrendingUp,
      title: "Win the Lottery",
      description:
        "Every seal = 1 lottery ticket. Weekly draw. Someone gets a giant check delivered by a guy in a turtle suit.",
    },
  ]

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-4xl md:text-6xl font-bold mb-16 text-center text-balance">
          How <span className="text-green-400">It Works</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="bg-card border-border p-6 relative group hover:border-green-500/50 transition-all"
            >
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-green-500 text-black rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>

              <div className="w-14 h-14 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <step.icon className="w-7 h-7 text-green-400" />
              </div>

              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
