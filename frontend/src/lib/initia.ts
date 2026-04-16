import { RESTClient } from "@initia/initia.js";
import { LCD_URL, CHAIN_ID } from "./constants";

export const initiaClient = new RESTClient(LCD_URL, {
  chainId: CHAIN_ID,
  gasPrices: "0.15uinit",
  gasAdjustment: "1.4",
});

export const shortenAddress = (addr: string) => {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export const formatINIT = (uinit: number) => {
  return `${(uinit / 1_000_000).toFixed(2)} INIT`;
};

export const parseINIT = (init: string) => {
  return Math.floor(parseFloat(init) * 1_000_000);
};

// Mock data helpers for when MOCK_MODE is true
export const getMockCreatures = () => [
  {
    id: 1,
    name: "Flambo",
    element: "Fire",
    rarity: "Epic",
    level: 7,
    xp: 740,
    hp: 80,
    maxHp: 100,
    attack: 14,
    defense: 11,
    speed: 13,
    specialPower: 18,
    wins: 12,
    losses: 3,
    inBattle: false,
  },
  {
    id: 2,
    name: "Stonkus",
    element: "Earth",
    rarity: "Rare",
    level: 5,
    xp: 450,
    hp: 120,
    maxHp: 120,
    attack: 10,
    defense: 15,
    speed: 8,
    specialPower: 12,
    wins: 8,
    losses: 4,
    inBattle: false,
  }
];
