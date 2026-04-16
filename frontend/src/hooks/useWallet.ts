/**
 * useWallet — simple reusable hook for game components
 *
 * Wraps useInterwovenKit to expose the most common wallet state
 * in a game-friendly API. Use this instead of importing useInterwovenKit
 * directly in most components.
 */
import { useInterwovenKit } from './useInterwovenKit'

export interface WalletState {
  /** Bech32 address, e.g. init1abc... */
  address: string | null
  /** .init username if the player has one */
  username: string | null
  /** Whether a wallet is connected */
  isConnected: boolean
  /** Open the InterwovenKit connect modal */
  connect: () => void
  /** Open the wallet manager panel */
  openWallet: () => void
  /** Disconnect the current wallet */
  disconnect: () => void
  /** Auto-sign helpers */
  autoSign: {
    isLoading: boolean
    enable: (chainId?: string) => Promise<void>
    disable: (chainId?: string) => Promise<void>
    isEnabledByChain: Record<string, boolean>
    expiredAtByChain: Record<string, Date | null | undefined>
    granteeByChain: Record<string, string | undefined>
  }
  /** Submit a transaction and wait for block confirmation */
  requestTxBlock: (req: { messages: any[]; chainId?: string }) => Promise<any>
  /** Submit with explicit fee (auto-sign path) */
  submitTxBlock: (params: { messages: any[]; fee: any; chainId?: string }) => Promise<any>
  /** Estimate gas for a set of messages */
  estimateGas: (req: { messages: any[]; chainId?: string }) => Promise<number>
}

const disconnectedWallet: WalletState = {
  address: null,
  username: null,
  isConnected: false,
  connect: () => {},
  openWallet: () => {},
  disconnect: () => {},
  autoSign: {
    isLoading: false,
    enable: async () => {},
    disable: async () => {},
    isEnabledByChain: {},
    expiredAtByChain: {},
    granteeByChain: {},
  },
  requestTxBlock: async () => ({ transactionHash: '' }),
  submitTxBlock: async () => ({ transactionHash: '' }),
  estimateGas: async () => 0,
}

export function useWallet(): WalletState {
  const kit = useInterwovenKit()
  if (!kit) return disconnectedWallet
  return {
    address: kit.address ?? null,
    username: kit.username ?? null,
    isConnected: kit.isConnected ?? false,
    connect: kit.openConnect ?? (() => {}),
    openWallet: kit.openWallet ?? (() => {}),
    disconnect: kit.disconnect ?? (() => {}),
    autoSign: kit.autoSign ?? disconnectedWallet.autoSign,
    requestTxBlock: kit.requestTxBlock ?? disconnectedWallet.requestTxBlock,
    submitTxBlock: kit.submitTxBlock ?? disconnectedWallet.submitTxBlock,
    estimateGas: kit.estimateGas ?? disconnectedWallet.estimateGas,
  }
}
