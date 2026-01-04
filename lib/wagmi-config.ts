import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

// Use testnet for development
const isTestnet = process.env.NEXT_PUBLIC_TESTNET === 'true'

export const config = createConfig({
  chains: isTestnet ? [baseSepolia] : [base, baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'Outlier Clothiers',
    }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
