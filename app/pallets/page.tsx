import { PalletsHero } from "@/components/pallets/pallets-hero"
import { FundingPallets } from "@/components/pallets/funding-pallets"
import { PalletTimeline } from "@/components/pallets/pallet-timeline"
import { Footer } from "@/components/footer"
import { getOpenDrops } from "@/lib/pricing"

// Drops come from the contract; re-read at most once a minute.
export const revalidate = 60

export default async function PalletsPage() {
  const drops = await getOpenDrops()
  return (
    <main className="min-h-screen">
      <PalletsHero />
      <FundingPallets drops={drops} />
      <PalletTimeline />
      <Footer />
    </main>
  )
}
