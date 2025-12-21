import { Card } from "@/components/ui/card"
import { Flame, Target, Zap, Users } from "lucide-react"

export function JucheManifesto() {
  const principles = [
    {
      icon: Flame,
      title: "Self-Reliance",
      description:
        "Stop waiting for governments, corporations, or parents. You are your own safety net. Build your empire.",
    },
    {
      icon: Target,
      title: "No False Gods",
      description:
        "Pensions won't be there. Social security is a joke. The only security is what you create for yourself.",
    },
    {
      icon: Zap,
      title: "Move Fast",
      description: "While others debate, you execute. AI, crypto, code—leverage every tool. Speed beats perfection.",
    },
    {
      icon: Users,
      title: "Private Network",
      description: "Exclusive access to builders like you. Share strategies. Form partnerships. Win together.",
    },
  ]

  return (
    <section className="py-24 relative bg-gradient-to-b from-background to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-6 text-balance">
            The <span className="text-primary">Manifesto</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            For the sharp. The young. The anti-establishment. Those who refuse to be another cog in a broken system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {principles.map((item) => (
            <Card
              key={item.title}
              className="bg-card/50 border-border p-8 hover:border-primary/50 transition-all backdrop-blur-sm"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto text-center">
          <blockquote className="text-xl md:text-2xl font-serif italic text-primary/80 border-l-4 border-primary pl-6">
            "We're on Telegram. Paying with Stars. We don't fuck with dollars, man—that's not freedom."
          </blockquote>
        </div>
      </div>
    </section>
  )
}
