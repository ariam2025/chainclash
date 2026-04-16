export type ElementType = 'Fire' | 'Water' | 'Earth' | 'Wind' | 'Shadow';
export type RarityType = 'Common' | 'Rare' | 'Epic' | 'Legendary';
export type MoveType = 'Attack' | 'HeavyAttack' | 'Defend' | 'Special';
export type BattleState = 'waiting' | 'active' | 'finished';

export interface Creature {
  id: number;
  name: string;
  element: ElementType;
  rarity: RarityType;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  specialPower: number;
  wins: number;
  losses: number;
  inBattle: boolean;
}

export interface ActiveBattle {
  battleId: number;
  player1: string;
  player2: string;
  creature1: Creature;
  creature2: Creature;
  creature1Hp: number;
  creature2Hp: number;
  turn: number;
  p1MoveSubmitted: boolean;
  p2MoveSubmitted: boolean;
  state: BattleState;
  winner: string | null;
  isPve: boolean;
  botDifficulty: number;
  wager: number;
  battleLog: number[];
  p1Buff?: string | null;
  p2Buff?: string | null;
}

export interface TournamentEntry {
  id: number;
  name: string;
  participants: string[];
  round: number;
  winner: string | null;
  prizePool: number;
  entryFee: number;
  isOpen: boolean;
  weekNumber: number;
}

export interface LeaderboardEntry {
  address: string;
  username: string;
  totalBattles: number;
  totalWins: number;
  tournamentWins: number;
  bestCreatureLevel: number;
}

export interface ActivePowerUp {
  id: string;
  name: string;
  statKey: 'attack' | 'defense' | 'speed' | 'specialPower' | 'maxHp';
  multiplier: number;
  remainingBattles: number;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  type: 'powerup' | 'levelup' | 'cosmetic';
  statKey?: 'attack' | 'defense' | 'speed' | 'specialPower' | 'maxHp';
  multiplier?: number;
}
