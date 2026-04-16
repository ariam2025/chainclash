export const CHAIN_ID = "84532"
export const RPC_URL = "https://sepolia.base.org"
export const LCD_URL = "https://sepolia.base.org"
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"

export const ELEMENTS = ['Fire', 'Water', 'Earth'] as const
export const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary'] as const

// Element colours for UI
export const ELEMENT_COLORS: Record<string, string> = {
  Fire:   '#FF4D00',
  Water:  '#0EA5E9',
  Earth:  '#84CC16',
}

// Rarity colours
export const RARITY_COLORS: Record<string, string> = {
  Common:    '#9CA3AF',
  Rare:      '#3B82F6',
  Epic:      '#A855F7',
  Legendary: '#F59E0B',
}

export const MOVE_DESCRIPTIONS = {
  Attack:      { label: 'Attack',       emoji: '⚔️',  image: '/sword.png',  desc: 'Moderate damage, zero risk' },
  HeavyAttack: { label: 'Heavy Attack', emoji: '💥',  image: '/bomb.png',   desc: '1.8× power, 30% miss chance, recoil on miss' },
  Defend:      { label: 'Defend',       emoji: '🛡️',  image: '/defend.png',  desc: '50% reduction + 8% heal' },
  Special:     { label: 'Special',      emoji: '✨',  image: '/bolt.png',   desc: 'High damage + Elemental Buff (costs 10% HP)' },
}

export const BOT_NAMES = [
  'Bot Flambo', 'Bot Aquara', 'Bot Stonk'
]

export const MOCK_MODE = true // Keep app flow alive while Base migration is in progress.
