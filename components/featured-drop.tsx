"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Lock, Star } from "lucide-react"
import Image from "next/image"

const drops = [
  {
    id: 1,
    name: "Nuclear Winter Hoodie",
    price: "1,250",
    currency: "Stars",
    tonPrice: "45",
    stock: 8,
    total: 50,
    tier: "Platinum Only",
    image: "/black-luxury-hoodie-with-gold-radioactive-symbol.jpg",
  },
  {
    id: 2,
    name: "Panda Force Bomber",
    price: "2,100",
    currency: "Stars",
    tonPrice: "75",
    stock: 3,
    total: 25,
    tier: "Diamond Only",
    image: "/black-bomber-jacket-with-gold-panda-geometric-desi.jpg",
  },
  {
    id: 3,
    name: "Outlier Combat Pants",
    price: "890",
    currency: "Stars",
    tonPrice: "32",
    stock: 15,
    total: 75,
    tier: "Gold+",
    image: "/black-tactical-cargo-pants-with-gold-details.jpg",
  },
]

export function FeaturedDrop() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Flame className="w-4 h-4 mr-1" />
            Live Drop
          </Badge>
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            {"This Week's "}
            <span className="text-primary">Exclusive Drop</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            {"Limited quantities. Premium materials. Once they're gone, they're gone forever."}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {drops.map((drop) => (
            <Card
              key={drop.id}
              className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all duration-300"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-secondary">
                <Image
                  src={drop.image || "/placeholder.svg"}
                  alt={drop.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Stock Badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant="destructive" className="bg-destructive/90 backdrop-blur-sm">
                    {drop.stock} left
                  </Badge>
                </div>

                {/* Tier Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                    <Lock className="w-3 h-3 mr-1" />
                    {drop.tier}
                  </Badge>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="font-serif text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {drop.name}
                </h3>

                {/* Stock Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>{drop.stock} remaining</span>
                    <span>{drop.total} total</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-destructive to-primary transition-all duration-300"
                      style={{ width: `${((drop.total - drop.stock) / drop.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-3 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-primary fill-primary" />
                    <span className="text-2xl font-bold text-primary">{drop.price}</span>
                  </div>
                  <span className="text-muted-foreground">or</span>
                  <span className="text-xl font-semibold">{drop.tonPrice} TON</span>
                </div>

                {/* CTA */}
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Claim Now</Button>
              </div>
            </Card>
          ))}
        </div>

        {/* View All */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            className="border-primary/30 hover:border-primary hover:bg-primary/10 bg-transparent"
          >
            View Full Collection
          </Button>
        </div>
      </div>
    </section>
  )
}
