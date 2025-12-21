import { TacticalHero } from "@/components/tactical/tactical-hero"
import { TacticalProducts } from "@/components/tactical/tactical-products"
import { TacticalMission } from "@/components/tactical/tactical-mission"
import { Footer } from "@/components/footer"

export default function TacticalPage() {
  return (
    <main className="min-h-screen bg-black">
      <TacticalHero />
      <TacticalProducts />
      <TacticalMission />
      <Footer />
    </main>
  )
}
