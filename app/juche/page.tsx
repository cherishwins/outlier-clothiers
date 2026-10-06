import { JucheHero } from "@/components/juche/juche-hero"
import { JucheManifesto } from "@/components/juche/juche-manifesto"
import { JucheAccess } from "@/components/juche/juche-access"
import { Footer } from "@/components/footer"

export default function JuchePage() {
  return (
    <main className="min-h-screen">
      <JucheHero />
      <JucheManifesto />
      <JucheAccess />
      <Footer />
    </main>
  )
}
