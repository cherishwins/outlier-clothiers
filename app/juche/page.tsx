import { JucheHero } from "@/components/juche/juche-hero"
import { JucheManifesto } from "@/components/juche/juche-manifesto"
import { JucheAccess } from "@/components/juche/juche-access"
import { JucheNetwork } from "@/components/juche/juche-network"
import { Footer } from "@/components/footer"

export default function JuchePage() {
  return (
    <main className="min-h-screen">
      <JucheHero />
      <JucheManifesto />
      <JucheAccess />
      <JucheNetwork />
      <Footer />
    </main>
  )
}
