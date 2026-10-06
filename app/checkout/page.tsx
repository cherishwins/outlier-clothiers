import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { CheckoutPanel } from "@/components/checkout-panel"
import { WalletButton } from "@/components/wallet-connect"
import { parseDropId } from "@/lib/drop-id"

// /checkout?dropId=N: pay for drop N from your own wallet. The drop, its price
// and whether it is on sale all come from the contract.
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { dropId: raw } = await searchParams
  const dropId = parseDropId(typeof raw === "string" ? raw : undefined)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="Logo" width={40} height={40} />
            <span className="font-bold text-primary">OUTLIER CLOTHIERS</span>
          </Link>
          <WalletButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/drops" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Drops
        </Link>

        <h1 className="text-4xl font-bold mb-2">
          <span className="text-primary">Mystery Box</span> Checkout
        </h1>

        {dropId === null ? (
          <p className="text-muted-foreground mt-6">
            No drop selected. Pick one on the{" "}
            <Link href="/drops" className="text-primary hover:underline">
              drops page
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="text-muted-foreground mb-8">Drop #{dropId}, paid from your own wallet in USDC on Base.</p>
            <CheckoutPanel dropId={dropId} />
          </>
        )}
      </div>
    </main>
  )
}
