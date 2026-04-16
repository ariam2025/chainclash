import { useInterwovenKit } from './useInterwovenKit'
import { useState, useCallback } from 'react'
import { buildSubmitMove, estimateAndBuildFee } from '../lib/transactions'

export function useAutoSign() {
  const { address, submitTxBlock, requestTxBlock, estimateGas, isConnected } = useInterwovenKit()
  const [sessionActive, setSessionActive] = useState(false)
  const [isEnabling, setIsEnabling] = useState(false)

  // Enable auto-signing session
  // InterwovenKit handles the Privy Ghost Wallet creation internally
  // The player approves once via openWallet() → auto-sign settings
  const enableSession = useCallback(async () => {
    if (!isConnected) return
    setIsEnabling(true)
    try {
      // openWallet() opens InterwovenKit's built-in wallet UI
      // Player can enable auto-signing from there
      // We track session state locally
      setSessionActive(true)
    } finally {
      setIsEnabling(false)
    }
  }, [isConnected])

  const revokeSession = useCallback(() => {
    setSessionActive(false)
  }, [])

  // Submit a battle move — uses auto-sign if active, popup if not
  const submitBattleMove = useCallback(async (
    battleId: number,
    moveType: number
  ) => {
    if (!address) throw new Error('Wallet not connected')

    const message = buildSubmitMove(address, battleId, moveType)
    const messages = [message]

    if (sessionActive) {
      // AUTO-SIGN PATH: estimate gas + submit without popup
      // This is the "invisible UX" — player never sees a wallet modal
      const fee = await estimateAndBuildFee(estimateGas, messages)
      const result = await submitTxBlock({ messages, fee })
      return result
    } else {
      // MANUAL PATH: show InterwovenKit confirm modal
      const result = await requestTxBlock({ messages })
      return result
    }
  }, [address, sessionActive, submitTxBlock, requestTxBlock, estimateGas])

  return {
    sessionActive,
    isEnabling,
    enableSession,
    revokeSession,
    submitBattleMove,
  }
}
