import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" })
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "OUTLIER CLOTHIERS | Exclusive Streetwear Drops",
  description: "Premium streetwear for the Telegram generation. Limited drops. Exclusive access. Accept Stars & TON.",
  metadataBase: new URL("https://outlierclothiers.com"),
  openGraph: {
    title: "OUTLIER CLOTHIERS | Exclusive Streetwear Drops",
    description: "Premium streetwear for the Telegram generation. Limited drops. Exclusive access.",
    url: "https://outlierclothiers.com",
    siteName: "OUTLIER CLOTHIERS",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OUTLIER CLOTHIERS | Exclusive Streetwear Drops",
    description: "Premium streetwear for the Telegram generation.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
