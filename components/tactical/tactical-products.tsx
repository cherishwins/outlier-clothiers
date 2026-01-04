import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Radio, Wifi, Usb, Star } from "lucide-react"

const products = [
  {
    id: 1,
    name: "Stealth Field Kit",
    category: "Tactical Gear",
    price: "3,500",
    tonPrice: "125",
    description: "Black tactical jacket with RFID-blocking pockets, hidden compartments, and anti-surveillance fabric.",
    icon: Shield,
    inStock: true,
  },
  {
    id: 2,
    name: "Ghost Phone",
    category: "Hardware",
    price: "8,900",
    tonPrice: "320",
    description: "Pre-loaded with GrapheneOS, Tor, encrypted messengers, and security tools. No tracking. No Google.",
    icon: Wifi,
    inStock: true,
    featured: true,
  },
  {
    id: 3,
    name: "Signal Jammer Watch",
    category: "Hardware",
    price: "2,400",
    tonPrice: "85",
    description: "Tactical watch with built-in WiFi/Bluetooth jammer. Disable surveillance in your immediate radius.",
    icon: Radio,
    inStock: false,
  },
  {
    id: 4,
    name: "Dead Drop USB",
    category: "Hardware",
    price: "1,200",
    tonPrice: "42",
    description: "Self-destructing USB with military-grade encryption. Auto-wipes after 3 incorrect attempts.",
    icon: Usb,
    inStock: true,
  },
]

export function TacticalProducts() {
  return (
    <section className="py-24 relative bg-black">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            <span className="text-primary">Arsenal</span> of Privacy
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Tactical gear and pre-configured hardware for those who value operational security. Legal. Tested.
            Untraceable payments.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {products.map((product) => (
            <Card
              key={product.id}
              className={`bg-card/50 border-border p-6 hover:border-primary/50 transition-all backdrop-blur-sm ${
                product.featured ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <product.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge className="mb-2 text-xs bg-secondary text-secondary-foreground">{product.category}</Badge>
                      <h3 className="font-serif text-xl font-bold">{product.name}</h3>
                    </div>
                    {!product.inStock && (
                      <Badge variant="destructive" className="text-xs">
                        Sold Out
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="text-lg font-bold text-primary">{product.price}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">or {product.tonPrice} TON</span>
                    </div>

                    <Button
                      size="sm"
                      disabled={!product.inStock}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {product.inStock ? "Get Specs" : "Notify Me"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground max-w-3xl mx-auto">
            All products comply with local and international regulations. We verify legality before shipping. For
            educational and personal security purposes only.
          </p>
        </div>
      </div>
    </section>
  )
}
