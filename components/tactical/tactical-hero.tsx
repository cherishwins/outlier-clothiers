import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Eye, Lock, Radio } from "lucide-react"
import Image from "next/image"

export function TacticalHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Spotlight effect */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 text-sm">
            <Shield className="w-4 h-4 mr-2" />
            OPERATIONAL SECURITY DIVISION
          </Badge>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/images/wordmark.png"
              alt="JUCHE GANG"
              width={500}
              height={150}
              className="w-full max-w-xl h-auto"
              priority
            />
          </div>

          {/* Headline */}
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 text-balance">
            <span className="text-foreground">OUTLIER</span>
            <br />
            <span className="text-primary">TACTICAL</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty leading-relaxed">
            Privacy-focused tactical gear and hardware for the surveillance-aware. From encrypted comms to
            pre-configured security tools. Stay invisible.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto">
            {[
              { icon: Eye, label: "Privacy First" },
              { icon: Shield, label: "Military Grade" },
              { icon: Lock, label: "Encrypted" },
              { icon: Radio, label: "Off-Grid Ready" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 p-4 bg-card/50 border border-primary/20 rounded-lg backdrop-blur-sm"
              >
                <item.icon className="w-6 h-6 text-primary" />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Shield className="w-5 h-5 mr-2" />
              Browse Tactical Gear
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-primary/30 hover:border-primary hover:bg-primary/10 bg-transparent"
            >
              View Hardware Catalog
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Anonymous Shipping
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              No Data Retention
            </div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              TON/Stars Only
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
