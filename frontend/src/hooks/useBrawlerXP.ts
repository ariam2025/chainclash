import { useState, useCallback } from 'react'
import type { ActivePowerUp, StoreItem } from '../lib/types'

// ─── XP Earn Rates ──────────────────────────────────────────────────────────
export function calcXpReward(isWin: boolean, botLevel: number, winReason: 'ko' | 'decision' | null): number {
  if (!isWin) return 10 // participation XP
  let base = 30
  if (botLevel >= 6) base = 100
  else if (botLevel >= 2) base = 60
  if (winReason === 'decision') base = Math.max(10, base - 20)
  return base
}

// ─── Store Catalogue ────────────────────────────────────────────────────────
export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'battle_cry',
    name: 'Battle Cry',
    description: '+25% Attack power for your next battle',
    icon: '⚔️',
    cost: 50,
    type: 'powerup',
    statKey: 'attack',
    multiplier: 1.25,
  },
  {
    id: 'iron_skin',
    name: 'Iron Skin',
    description: '+30% Defense for your next battle',
    icon: '🛡️',
    cost: 50,
    type: 'powerup',
    statKey: 'defense',
    multiplier: 1.30,
  },
  {
    id: 'adrenaline_rush',
    name: 'Adrenaline Rush',
    description: '+25% Speed — you always move first for one battle',
    icon: '⚡',
    cost: 60,
    type: 'powerup',
    statKey: 'speed',
    multiplier: 1.25,
  },
  {
    id: 'super_charge',
    name: 'Super Charge',
    description: '+30% Special Power for your next battle',
    icon: '🔮',
    cost: 70,
    type: 'powerup',
    statKey: 'specialPower',
    multiplier: 1.30,
  },
  {
    id: 'vitality_shard',
    name: 'Vitality Shard',
    description: '+20% Max HP for your next battle',
    icon: '💎',
    cost: 60,
    type: 'powerup',
    statKey: 'maxHp',
    multiplier: 1.20,
  },
]

// ─── LocalStorage helpers ────────────────────────────────────────────────────
const XP_KEY = 'brawlers_xp'
const POWERUPS_KEY = 'brawlers_powerups'
const LEVELS_KEY = 'brawlers_creature_levels'

function loadXp(): number {
  try { return parseInt(localStorage.getItem(XP_KEY) || '0', 10) } catch { return 0 }
}
function saveXp(v: number) {
  try { localStorage.setItem(XP_KEY, String(v)) } catch {}
}
function loadPowerUps(): ActivePowerUp[] {
  try { return JSON.parse(localStorage.getItem(POWERUPS_KEY) || '[]') } catch { return [] }
}
function savePowerUps(v: ActivePowerUp[]) {
  try { localStorage.setItem(POWERUPS_KEY, JSON.stringify(v)) } catch {}
}
function loadLevels(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(LEVELS_KEY) || '{}') } catch { return {} }
}
function saveLevels(v: Record<number, number>) {
  try { localStorage.setItem(LEVELS_KEY, JSON.stringify(v)) } catch {}
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useBrawlerXP() {
  const [xp, setXpState] = useState<number>(loadXp)
  const [activePowerUps, setActivePowerUpsState] = useState<ActivePowerUp[]>(loadPowerUps)
  const [creatureLevelBoosts, setCreatureLevelBoostsState] = useState<Record<number, number>>(loadLevels)

  const setXp = useCallback((v: number) => {
    saveXp(v)
    setXpState(v)
  }, [])

  const setPowerUps = useCallback((v: ActivePowerUp[]) => {
    savePowerUps(v)
    setActivePowerUpsState(v)
  }, [])

  const setLevels = useCallback((v: Record<number, number>) => {
    saveLevels(v)
    setCreatureLevelBoostsState(v)
  }, [])

  /** Award XP after a battle */
  const addXp = useCallback((amount: number) => {
    setXp(Math.max(0, loadXp() + amount))
  }, [setXp])

  /** Purchase a power-up from the store */
  const buyPowerUp = useCallback((item: StoreItem): boolean => {
    const current = loadXp()
    if (current < item.cost) return false
    setXp(current - item.cost)
    const newPowerUp: ActivePowerUp = {
      id: item.id,
      name: item.name,
      statKey: item.statKey!,
      multiplier: item.multiplier!,
      remainingBattles: 1,
    }
    const updated = [...loadPowerUps(), newPowerUp]
    setPowerUps(updated)
    return true
  }, [setXp, setPowerUps])

  /** Purchase a level-up for a specific creature */
  const buyLevelUp = useCallback((creatureId: number, creatureLevel: number): boolean => {
    const cost = 80 * creatureLevel
    const current = loadXp()
    if (current < cost) return false
    setXp(current - cost)
    const levels = loadLevels()
    const updated = { ...levels, [creatureId]: (levels[creatureId] || 0) + 1 }
    setLevels(updated)
    return true
  }, [setXp, setLevels])

  /** Called after a battle starts — consume single-use power-ups */
  const consumePowerUps = useCallback(() => {
    const remaining = loadPowerUps()
      .map(p => ({ ...p, remainingBattles: p.remainingBattles - 1 }))
      .filter(p => p.remainingBattles > 0)
    setPowerUps(remaining)
  }, [setPowerUps])

  /** Get extra levels bought in store for a given creature */
  const getExtraLevels = useCallback((creatureId: number): number => {
    return creatureLevelBoosts[creatureId] || 0
  }, [creatureLevelBoosts])

  return {
    xp,
    activePowerUps,
    creatureLevelBoosts,
    addXp,
    buyPowerUp,
    buyLevelUp,
    consumePowerUps,
    getExtraLevels,
  }
}
