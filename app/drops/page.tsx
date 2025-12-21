import { DropsHero } from "@/components/drops/drops-hero"
import { ActiveDrops } from "@/components/drops/active-drops"
import { HowDropsWork } from "@/components/drops/how-drops-work"
import { Footer } from "@/components/footer"

export default function DropsPage() {
  return (
    <main className="min-h-screen">
      <DropsHero />
      <ActiveDrops />
      <HowDropsWork />
      <Footer />
    </main>
  )
}
