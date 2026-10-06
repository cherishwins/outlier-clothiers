import { DropsHero } from "@/components/drops/drops-hero"
import { ActiveDrops } from "@/components/drops/active-drops"
import { HowDropsWork } from "@/components/drops/how-drops-work"
import { Footer } from "@/components/footer"
import { getOpenDrops } from "@/lib/pricing"

// Drops come from the contract; re-read at most once a minute.
export const revalidate = 60

export default async function DropsPage() {
  const drops = await getOpenDrops()
  return (
    <main className="min-h-screen">
      <DropsHero />
      <ActiveDrops drops={drops} />
      <HowDropsWork />
      <Footer />
    </main>
  )
}
