import { useQuery } from '@tanstack/react-query'
import { useInterwovenKit } from './useInterwovenKit'
import { useCallback } from 'react'
import { buildMintCreature, buildSetUsername, buildReleaseCreature } from '../lib/transactions'
import { CONTRACT_ADDRESS, MOCK_MODE } from '../lib/constants'
import { initiaClient } from '../lib/initia'
import { getMockCreatures } from '../lib/initia'
import type { Creature } from '../lib/types'

import { bcs, AccAddress } from '@initia/initia.js'

export function useCreature(overrideAddress?: string) {
  const { address, requestTxBlock, isConnected } = useInterwovenKit()
  const targetAddress = overrideAddress ?? address

  // Fetch creature list from on-chain view function
  const { data: creatures, isLoading, error, refetch } = useQuery<Creature[]>({
    queryKey: ['creatures', targetAddress],
    queryFn: async () => {
      // If MOCK_MODE is on OR if we're a guest (no address), return mock data for preview
      if (MOCK_MODE || !targetAddress) return getMockCreatures() as Creature[]

      // Avoid calls with invalid addresses to prevent API 400 errors
      if (!AccAddress.validate(targetAddress)) {
        console.warn("Invalid address detected in useCreature, skipping query:", targetAddress);
        return [];
      }

      // Call Move view function: brawlers::get_stable(addr)
      try {
        // Initia REST API expects BCS-serialized base64 for address arguments
        // This matches the working logic in your test5.js script
        const serializedAddress = bcs.address().serialize(targetAddress).toBase64()
        
        const res = await initiaClient.move.viewFunction<any[]>(
          CONTRACT_ADDRESS,
          'brawlers',
          'get_stable',
          [],
          [serializedAddress]
        )
        // SDK's viewFunction automatically JSON-parses the move result into a JS object/array
        return parseCreaturesFromChain(res ?? [])
      } catch (err) {
        console.error("View function 'get_stable' failed. Check if LCD_URL is reachable and CONTRACT_ADDRESS is correct.", err)
        return []
      }
    },
    enabled: !!targetAddress || MOCK_MODE,
    refetchInterval: 5000,
    staleTime: 4000,
  })

  // Mint a new creature
  const mintCreature = useCallback(async (
    name: string,
    element: number,
    rarity: number,
  ) => {
    if (MOCK_MODE) return { transactionHash: 'mock_hash' }
    if (!address) throw new Error('Wallet not connected')
    

    const seed = Math.floor(Date.now() / 1000) % 100000
    const message = buildMintCreature(address, name, element, rarity, seed)
    const result = await requestTxBlock({ messages: [message] })
    await refetch()
    return result
  }, [address, requestTxBlock, refetch])

  // Set .init username on-chain
  const setUsername = useCallback(async (username: string) => {
    if (MOCK_MODE) return { transactionHash: 'mock_hash' }
    if (!address) throw new Error('Wallet not connected')
    const message = buildSetUsername(address, username)
    const result = await requestTxBlock({ messages: [message] })
    return result
  }, [address, requestTxBlock])

  // Release a creature (delete from stable)
  const releaseCreature = useCallback(async (creatureId: number) => {
    if (MOCK_MODE) return { transactionHash: 'mock_hash' }
    if (!address) throw new Error('Wallet not connected')
    
    const message = buildReleaseCreature(address, creatureId)
    const result = await requestTxBlock({ messages: [message] })
    await refetch()
    return result
  }, [address, requestTxBlock, refetch])

  return {
    creatures: (creatures ?? []) as Creature[],
    isLoading,
    error,
    refetch,
    mintCreature,
    setUsername,
    releaseCreature,
    hasCreatures: ((creatures as Creature[])?.length ?? 0) > 0,
    isConnected
  }
}

// Parse Move struct return value into TypeScript Creature type
function parseCreaturesFromChain(data: any[]): Creature[] {
  if (!data || !Array.isArray(data)) return []
  return data.map((c: any) => ({
    id: Number(c.id),
    name: c.name,
    element: ['Fire','Water','Earth','Wind','Shadow'][c.element] as any,
    rarity: ['Common','Rare','Epic','Legendary'][c.rarity] as any,
    level: Number(c.level),
    xp: Number(c.xp),
    hp: Number(c.hp),
    maxHp: Number(c.max_hp),
    attack: Number(c.attack),
    defense: Number(c.defense),
    speed: Number(c.speed),
    specialPower: Number(c.special_power),
    wins: Number(c.wins),
    losses: Number(c.losses),
    inBattle: Boolean(c.in_battle),
  } as Creature))
}
