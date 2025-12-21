import { PalletsHero } from "@/components/pallets/pallets-hero"
import { FundingPallets } from "@/components/pallets/funding-pallets"
import { PalletTimeline } from "@/components/pallets/pallet-timeline"
import { Footer } from "@/components/footer"

export default function PalletsPage() {
  return (
    <main className="min-h-screen">
      <PalletsHero />
      <FundingPallets />
      <PalletTimeline />
      <Footer />
    </main>
  )
}
