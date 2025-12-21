import { MemesealHero } from "@/components/memeseal/memeseal-hero"
import { MemesealPricing } from "@/components/memeseal/memeseal-pricing"
import { MemesealHowItWorks } from "@/components/memeseal/memeseal-how-it-works"
import { MemesealCasino } from "@/components/memeseal/memeseal-casino"
import { Footer } from "@/components/footer"

export default function MemesealPage() {
  return (
    <main className="min-h-screen">
      <MemesealHero />
      <MemesealHowItWorks />
      <MemesealPricing />
      <MemesealCasino />
      <Footer />
    </main>
  )
}
