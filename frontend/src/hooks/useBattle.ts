import { useQuery } from '@tanstack/react-query'
import { useInterwovenKit } from './useInterwovenKit'
import { useAutoSign } from './useAutoSign'
import { buildStartPveBattle, buildChallengePlayer, buildAcceptChallenge, encodeU64, buildSubmitMove } from '../lib/transactions'
import { LCD_URL, CONTRACT_ADDRESS, MOCK_MODE } from '../lib/constants'
import type { ActiveBattle, MoveType } from '../lib/types'

const MOVE_CODES: Record<MoveType, number> = {
  Attack: 0, HeavyAttack: 1, Defend: 2, Special: 3
}

export function useBattle(battleId: number | null) {
  const { address, requestTxBlock } = useInterwovenKit()
  const { submitBattleMove, sessionActive } = useAutoSign()

  // Poll battle state every 2 seconds during active battle
  const { data: battle, isLoading } = useQuery<ActiveBattle | null>({
    queryKey: ['battle', battleId],
    queryFn: async () => {
      if (!battleId) return null
      if (MOCK_MODE) return null
      const res = await fetch(
        `${LCD_URL}/initia/move/v1/accounts/${CONTRACT_ADDRESS}/view_functions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            function_name: 'get_battle',
            type_args: [],
            args: [btoa(String.fromCharCode(...encodeU64(battleId)))],
          }),
        }
      )
      const data = await res.json()
      return parseBattleFromChain(data.data)
    },
    enabled: !!battleId && !MOCK_MODE,
    refetchInterval: 3000, // Fixed 3s polling is safer than self-referential check
  })

  // Start PvE battle
  const startPve = async (creatureId: number, maxHp: number, difficulty: number) => {
    if (MOCK_MODE) return { transactionHash: 'mock_hash' }
    if (!address) throw new Error('Not connected')
    const message = buildStartPveBattle(address, creatureId, maxHp, difficulty)
    return await requestTxBlock({ messages: [message] })
  }

  // Get current total battles (used to find latest ID)
  const getTotalBattles = async () => {
    if (MOCK_MODE) return 0
    try {
      const res = await fetch(
        `${LCD_URL}/initia/move/v1/accounts/${CONTRACT_ADDRESS}/view_functions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            function_name: 'get_total_battles',
            type_args: [],
            args: [],
          }),
        }
      )
      const data = await res.json()
      if (!data || data.data === undefined) return 0
      const count = Number(data.data)
      return isNaN(count) ? 0 : count
    } catch (err) {
      console.error('Failed to get total battles:', err)
      return 0
    }
  }

  // Challenge a player
  const createChallenge = async (creatureId: number, opponent: string, wager: number) => {
    if (MOCK_MODE) return { transactionHash: 'mock_hash' }
    if (!address) throw new Error('Not connected')
    const message = buildChallengePlayer(address, creatureId, opponent, wager)
    return await requestTxBlock({ messages: [message] })
  }

  // Accept a challenge
  const acceptChallenge = async (bId: number, creatureId: number, creatureMaxHp: number) => {
    if (MOCK_MODE) return { transactionHash: 'mock_hash' }
    if (!address) throw new Error('Not connected')
    const message = buildAcceptChallenge(address, bId, creatureId, creatureMaxHp)
    return await requestTxBlock({ messages: [message] })
  }

  // Submit battle move — uses auto-signing if session active
  const submitMove = async (moveType: MoveType) => {
    if (MOCK_MODE) return { transactionHash: 'mock_hash' }
    if (!battleId || !address) throw new Error('No active battle')
    const moveCode = MOVE_CODES[moveType]
    // submitBattleMove uses auto-sign if session active, popup if not
    return await submitBattleMove(battleId, moveCode)
  }

  return {
    battle,
    isLoading,
    submitMove,
    startPve,
    getTotalBattles,
    createChallenge,
    acceptChallenge,
    sessionActive,
  }
}

function parseBattleFromChain(data: any): ActiveBattle | null {
  if (!data) return null
  return {
    battleId: Number(data.battle_id),
    player1: data.player1,
    player2: data.player2,
    creature1: data.creature1,
    creature2: data.creature2,
    creature1Hp: Number(data.creature1_hp),
    creature2Hp: Number(data.creature2_hp),
    turn: Number(data.turn),
    p1MoveSubmitted: data.p1_move !== 255,
    p2MoveSubmitted: data.p2_move !== 255,
    state: ['waiting','active','finished'][data.state] as any,
    winner: data.winner || null,
    isPve: Boolean(data.is_pve),
    botDifficulty: Number(data.bot_difficulty),
    wager: Number(data.wager) / 1_000_000,
    battleLog: data.battle_log ?? [],
  }
}
