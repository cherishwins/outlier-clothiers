import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Image src="/logo.png" alt="OUTLIER CLOTHIERS" width={60} height={60} className="mb-4" />
            <h3 className="font-serif text-xl font-bold mb-3">OUTLIER CLOTHIERS</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md text-pretty leading-relaxed">
              {
                "Mystery boxes from manifested liquidation loads, pre-funded through an on-chain escrow contract. Pay with Telegram Stars, USDC or card."
              }
            </p>
            <a href="https://t.me/OutlierClothiersBot" target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Send className="w-4 h-4 mr-2" />
                Join on Telegram
              </Button>
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/drops" className="hover:text-primary transition-colors">
                  Current Drops
                </a>
              </li>
              <li>
                <a href="/pallets" className="hover:text-primary transition-colors">
                  Active Pallets
                </a>
              </li>
              <li>
                <a href="/juche" className="hover:text-primary transition-colors">
                  JUCHE GANG
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:jesse@outlierclothiers.com" className="hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© 2025 OUTLIER CLOTHIERS. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Contact:</span>
              <a href="mailto:jesse@outlierclothiers.com" className="text-primary hover:underline">
                jesse@outlierclothiers.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
