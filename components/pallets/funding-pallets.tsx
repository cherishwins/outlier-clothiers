import { DropGrid, NoDrops } from "@/components/drops/active-drops"
import type { OpenDrop } from "@/lib/pricing"

export function FundingPallets({ drops }: { drops: OpenDrop[] | null }) {
  return (
    <section id="funding" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-balance">
            Pallets <span className="text-primary">Funding Now</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Each drop buys one manifested liquidation load once it reaches its target. Progress is read from the escrow
            contract.
          </p>
        </div>

        {drops && drops.length > 0 ? <DropGrid drops={drops} /> : <NoDrops unavailable={drops === null} />}

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            We link the manifest of the load each drop buys. If a drop is cancelled, or is not released by its deadline,
            its deposits are refundable from the contract.
          </p>
        </div>
      </div>
    </section>
  )
}
