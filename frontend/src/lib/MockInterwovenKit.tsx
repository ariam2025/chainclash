import React, { createContext, useContext, useState } from 'react'

// Export context so useInterwovenKit can safely read it with useContext
// (reading a context that has no provider just returns the default value — no crash)
export const MockKitContext = createContext<any>(null)

/** Safe fallback when MOCK_MODE is on but MockInterwovenKitProvider is missing */
export const DISCONNECTED_MOCK_KIT = {
  address: null as string | null,
  initiaAddress: null as string | null,
  username: null as string | null,
  isConnected: false,
  isOpen: false,
  openConnect: () => {},
  openWallet: () => {},
  openBridge: () => {},
  openDeposit: () => {},
  openWithdraw: () => {},
  disconnect: () => {},
  requestTxBlock: async (_req: any) => ({ transactionHash: 'mock_' + Date.now() }),
  requestTxSync: async (_req: any) => 'mock_' + Date.now(),
  submitTxBlock: async (_params: any) => ({ transactionHash: 'mock_' + Date.now() }),
  submitTxSync: async (_params: any) => 'mock_' + Date.now(),
  estimateGas: async (_req: any) => 100000,
  simulateTx: async (_req: any) => ({ gasInfo: { gasUsed: 100000n, gasWanted: 100000n } }),
  waitForTxConfirmation: async (_params: any) => null,
  offlineSigner: null,
  hexAddress: null as string | null,
  autoSign: {
    isLoading: false,
    enable: async (_chainId?: string) => {},
    disable: async (_chainId?: string) => {},
    expiredAtByChain: {} as Record<string, Date | null | undefined>,
    isEnabledByChain: {} as Record<string, boolean>,
    granteeByChain: {} as Record<string, string | undefined>,
  },
}

export const MockInterwovenKitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true)
  const [userName] = useState<string | null>(null)

  const value = {
    address: isConnected ? '0x1234567890abcdef1234567890abcdef12345678' : null,
    initiaAddress: isConnected ? '0x1234567890abcdef1234567890abcdef12345678' : null,
    username: isConnected ? userName ?? 'brawler' : null,
    isConnected,
    isOpen: false,
    openConnect: () => setIsConnected(true),
    openWallet: () => console.log('[Mock] Open Wallet'),
    openBridge: () => console.log('[Mock] Open Bridge'),
    openDeposit: () => console.log('[Mock] Open Deposit'),
    openWithdraw: () => console.log('[Mock] Open Withdraw'),
    disconnect: () => setIsConnected(false),
    requestTxBlock: async (_req: any) => ({ transactionHash: 'mock_' + Date.now() }),
    requestTxSync: async (_req: any) => 'mock_' + Date.now(),
    submitTxBlock: async (_params: any) => ({ transactionHash: 'mock_' + Date.now() }),
    submitTxSync: async (_params: any) => 'mock_' + Date.now(),
    estimateGas: async (_req: any) => 100000,
    simulateTx: async (_req: any) => ({ gasInfo: { gasUsed: 100000n, gasWanted: 100000n } }),
    waitForTxConfirmation: async (_params: any) => null,
    offlineSigner: null,
    hexAddress: isConnected ? '0x' + '0'.repeat(40) : null,
    autoSign: {
      isLoading: false,
      enable: async (_chainId?: string) => {},
      disable: async (_chainId?: string) => {},
      expiredAtByChain: {} as Record<string, Date | null | undefined>,
      isEnabledByChain: {} as Record<string, boolean>,
      granteeByChain: {} as Record<string, string | undefined>,
    },
  }

  return <MockKitContext.Provider value={value}>{children}</MockKitContext.Provider>
}
