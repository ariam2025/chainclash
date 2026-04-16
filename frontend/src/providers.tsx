import { PropsWithChildren, useEffect } from 'react'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  initiaPrivyWalletConnector,
  injectStyles,
  InterwovenKitProvider,
  TESTNET,
} from '@initia/interwovenkit-react'
import interwovenKitStyles from '@initia/interwovenkit-react/styles.js'
import { CHAIN_ID, MOCK_MODE } from './lib/constants'
import { MockInterwovenKitProvider } from './lib/MockInterwovenKit'

// Wagmi config — required peer dependency
const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [baseSepolia],
  transports: { [baseSepolia.id]: http() },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3000,
      refetchInterval: 5000,
      retry: 1,
    },
  },
})

export default function Providers({ children }: PropsWithChildren) {
  useEffect(() => {
    if (!MOCK_MODE) {
      // REQUIRED: inject InterwovenKit stylesheet into shadow DOM
      injectStyles(interwovenKitStyles)
    }
  }, [])

  if (MOCK_MODE) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <MockInterwovenKitProvider>{children}</MockInterwovenKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId={CHAIN_ID}
          theme="dark"
          enableAutoSign
        >
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
