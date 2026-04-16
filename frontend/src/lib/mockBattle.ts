import type { Creature, ActiveBattle, MoveType } from './types'

const MOVE_CODES: Record<MoveType, number> = {
  Attack: 0, HeavyAttack: 1, Defend: 2, Special: 3
}

// Element advantage table — mirrors battle.move exactly
function elementMultiplier(attackerEl: string, defenderEl: string): number {
  const advantages: Record<string, string> = {
    Fire: 'Earth', Earth: 'Wind', Wind: 'Water', Water: 'Fire'
  }
  const weaknesses: Record<string, string> = {
    Fire: 'Water', Earth: 'Fire', Wind: 'Earth', Water: 'Wind'
  }
  if (advantages[attackerEl] === defenderEl) return 1.3
  if (weaknesses[attackerEl] === defenderEl) return 0.7
  return 1.0
}

// Bot AI — mirrors battle.move bot_choose_move exactly
// Bot AI — focuses on Survival Strategy
function botChooseMove(
  botCreature: Creature,
  playerCreature: Creature,
  botHp: number, botMaxHp: number,
  playerHp: number, playerMaxHp: number,
  turn: number
): MoveType {
  const level = botCreature.level
  
  // EARLY GAME (Level 1-3) - Forgiving AI
  if (level <= 3) {
    // ALWAYS uses ATTACK (80%), DEFEND (20%)
    return (Math.random() < 0.8) ? 'Attack' : 'Defend'
  }

  // MID GAME (Level 4-10) - Real strategy starts
  if (level <= 10) {
    if (botHp < botMaxHp * 0.3) return 'Defend'
    if (turn % 3 === 0) return (Math.random() < 0.6) ? 'HeavyAttack' : 'Attack'
    return 'Attack'
  }

  // LATE GAME / HARD MODE (Adaptive)
  // Adaptive: reads HP and patterns
  if (botHp < botMaxHp * 0.25) return 'Defend'
  if (playerHp < playerMaxHp * 0.2 && botHp > botMaxHp * 0.4) return 'HeavyAttack'
  if (turn % 4 === 1) return 'Special'
  
  // Randomness to avoid predictable pattern reading by player
  const rand = Math.random()
  if (rand < 0.4) return 'Attack'
  if (rand < 0.7) return 'HeavyAttack'
  if (rand < 0.9) return 'Defend'
  return 'Special'
}

// Resolve one turn — returns updated HPs and log entry
export function resolveTurn(
  playerCreature: Creature,
  botCreature: Creature,
  playerMove: MoveType,
  botMove: MoveType,
  playerHp: number,
  botHp: number,
  turn: number,
  playerBuff: string | null = null,
  botBuff: string | null = null
): {
  newPlayerHp: number
  newBotHp: number
  playerDamageDealt: number
  botDamageDealt: number
  playerMissed: boolean
  botMissed: boolean
  playerHealed: number
  botHealed: number
  playerRecoil: number
  botRecoil: number
  playerNewBuff: string | null
  botNewBuff: string | null
  clutchSurvival: boolean
  logLine: string
} {
  const level = playerCreature.level
  
  // DETERMINE SPEED ORDER
  // Buffs can affect speed (Wind: +30%)
  const playerSpd = playerBuff === 'Wind' ? playerCreature.speed * 1.3 : playerCreature.speed
  const botSpd = botBuff === 'Wind' ? botCreature.speed * 1.3 : botCreature.speed
  const playerFirst = playerSpd >= botSpd

  let newPlayerHp = playerHp
  let newBotHp = botHp
  let playerNewBuff: string | null = null
  let botNewBuff: string | null = null
  let playerDamageDealt = 0
  let botDamageDealt = 0
  let playerHealed = 0
  let botHealed = 0
  let playerRecoil = 0
  let botRecoil = 0
  let playerMissed = false
  let botMissed = false

  // APPLY MOVES IN SPEED ORDER
  const actors = playerFirst
    ? [
        { isPlayer: true, move: playerMove, self: playerCreature, opp: botCreature, selfBuff: playerBuff, oppBuff: botBuff, oppMove: botMove },
        { isPlayer: false, move: botMove, self: botCreature, opp: playerCreature, selfBuff: botBuff, oppBuff: playerBuff, oppMove: playerMove },
      ]
    : [
        { isPlayer: false, move: botMove, self: botCreature, opp: playerCreature, selfBuff: botBuff, oppBuff: playerBuff, oppMove: playerMove },
        { isPlayer: true, move: playerMove, self: playerCreature, opp: botCreature, selfBuff: playerBuff, oppBuff: botBuff, oppMove: botMove },
      ]

  for (const actor of actors) {
    const isEarlyGame = level <= 3
    
    // 1. SURVIVAL MODIFIER (HP < 30%)
    const currentSelfHp = actor.isPlayer ? newPlayerHp : newBotHp
    const hpRatio = currentSelfHp / actor.self.maxHp
    let survivalScaling = 1.0
    if (hpRatio < 0.3) {
      survivalScaling = 0.9 // -10% incoming dmg
      if (isEarlyGame) survivalScaling = 0.8 // -20% incoming dmg in early game assist
    }

    // 2. APPLY MOVE EFFECTS
    if (actor.move === 'Defend') {
      let healPct = 0.08
      if (isEarlyGame) healPct *= 1.2 // +20% heal in early game
      if (hpRatio < 0.3 && isEarlyGame) healPct += 0.05 // Extra assist heal
      const healed = Math.floor(actor.self.maxHp * healPct)
      
      if (actor.isPlayer) {
        newPlayerHp = Math.min(newPlayerHp + healed, actor.self.maxHp)
        playerHealed = healed
      } else {
        newBotHp = Math.min(newBotHp + healed, actor.self.maxHp)
        botHealed = healed
      }
      continue
    }

    // 3. DAMAGE CALCULATION
    const oppDefending = actor.oppMove === 'Defend'
    const defMultiplier = oppDefending ? 0.5 : 1.0 // Defend reduces dmg by 50%
    
    // Earth Buff: +30% defense (simulated as -20% incoming damage)
    const earthScaling = (actor.oppBuff === 'Earth') ? 0.7 : 1.0
    
    // Water Buff: Affects Healing next turn, but let's check it for Lifesteal here too? 
    // Spec says Shadow is lifesteal. Shadow: recover 30% damage dealt.
    
    let rawDmg = 0
    let missed = false
    let selfCost = 0
    
    if (actor.move === 'Attack') {
      rawDmg = actor.self.attack
    } else if (actor.move === 'HeavyAttack') {
      // 30% miss if slower or equal speed
      const isSlower = actor.isPlayer ? playerSpd <= botSpd : botSpd <= playerSpd
      if (isSlower && Math.random() < 0.3) {
        missed = true
        rawDmg = 0
        const recoil = Math.floor(actor.self.maxHp * 0.05)
        if (actor.isPlayer) { newPlayerHp = Math.max(newPlayerHp - recoil, 0); playerRecoil = recoil }
        else { newBotHp = Math.max(newBotHp - recoil, 0); botRecoil = recoil }
      } else {
        rawDmg = actor.self.attack * 1.8
      }
    } else if (actor.move === 'Special') {
      rawDmg = actor.self.specialPower * 1.5
      selfCost = Math.floor(actor.self.maxHp * 0.1) // 10% recoil
      
      // Grant next turn buff
      if (actor.isPlayer) playerNewBuff = actor.self.element
      else botNewBuff = actor.self.element
    }

    // Apply Boosts (Fire: +30% attack dmg)
    if (actor.selfBuff === 'Fire') rawDmg *= 1.3

    // Apply Element advantage (Mid Game+)
    let elMult = 1.0
    if (level >= 4) {
      elMult = elementMultiplier(actor.self.element, actor.opp.element)
      if (elMult > 1) elMult = 1.3 // ±30% instead of original ±20%
      else if (elMult < 1) elMult = 0.7
    }

    // Final Damage
    let finalDmg = Math.floor((rawDmg - actor.opp.defense / 4) * defMultiplier * elMult * survivalScaling * earthScaling)
    if (!missed) finalDmg = Math.max(finalDmg, 1)

    // Early Game Enemy Dmg Reduction (-50% for level 1-3)
    if (!actor.isPlayer && isEarlyGame) finalDmg = Math.floor(finalDmg * 0.5)

    // Shadow Buff: Recovers 30% damage dealt
    if (actor.self.element === 'Shadow' && actor.move === 'Special' && !missed) {
      const heal = Math.floor(finalDmg * 0.3)
      if (actor.isPlayer) { newPlayerHp = Math.min(newPlayerHp + heal, actor.self.maxHp); playerHealed += heal }
      else { newBotHp = Math.min(newBotHp + heal, actor.self.maxHp); botHealed += heal }
    }

    // Apply Self Cost (Special)
    if (actor.isPlayer) {
      newPlayerHp = Math.max(newPlayerHp - selfCost, 0)
      playerDamageDealt = finalDmg
      newBotHp = Math.max(newBotHp - finalDmg, 0)
      playerMissed = missed
    } else {
      newBotHp = Math.max(newBotHp - selfCost, 0)
      botDamageDealt = finalDmg
      newPlayerHp = Math.max(newPlayerHp - finalDmg, 0)
      botMissed = missed
    }
  }

  // EARLY GAME DEATH PROTECTION: Cannot die in first 4 turns
  if (level <= 3 && turn <= 4) {
    if (newPlayerHp === 0) newPlayerHp = 1
  }

  // CHECK FOR CLUTCH SURVIVAL
  const clutchSurvival = playerHp > 0 && newPlayerHp > 0 && newPlayerHp < playerCreature.maxHp * 0.05

  const logLine = missedLogLine(turn, playerMove, playerDamageDealt, playerMissed, botCreature.name, botMove, botDamageDealt, botMissed)

  return { 
    newPlayerHp, newBotHp, playerDamageDealt, botDamageDealt, playerMissed, botMissed, 
    playerHealed, botHealed, playerRecoil, botRecoil,
    playerNewBuff, botNewBuff, clutchSurvival, logLine 
  }
}

function missedLogLine(turn: number, pM: string, pD: number, pMi: boolean, bN: string, bM: string, bD: number, bMi: boolean): string {
  const pText = pMi ? `missed!` : `${pD} dmg`
  const bText = bMi ? `missed!` : `${bD} dmg`
  return `Turn ${turn}: You used ${pM} (${pText}). ${bN} used ${bM} (${bText}).`
}

export { botChooseMove }
