import { Tier } from './types'

export const STARTING_MMR = 1000
export const K_FACTOR = 20
export const MIN_OPPONENT_MMR = 600
export const STREAK_BONUS_MAX = 10
export const STREAK_BONUS_PER_WIN = 2

export const TIER_THRESHOLDS: { tier: Tier; minMMR: number }[] = [
  { tier: 'Crystal', minMMR: 2000 },
  { tier: 'Gold', minMMR: 1500 },
  { tier: 'Silver', minMMR: 1200 },
  { tier: 'Bronze', minMMR: 900 },
  { tier: 'Iron', minMMR: 0 },
]

export function getTier(mmr: number): Tier {
  for (const { tier, minMMR } of TIER_THRESHOLDS) {
    if (mmr >= minMMR) {
      return tier
    }
  }
  return 'Iron'
}

export function calculateMMRChange(
  playerMMR: number,
  opponentAvgMMR: number,
  isWin: boolean,
  currentStreak: number
): number {
  if (opponentAvgMMR < MIN_OPPONENT_MMR) {
    return 0
  }

  const basePoints = K_FACTOR * (1 / (1 + Math.pow(10, (opponentAvgMMR - playerMMR) / 400)))
  const streakBonus = Math.min(currentStreak * STREAK_BONUS_PER_WIN, STREAK_BONUS_MAX)

  if (isWin) {
    return Math.round(basePoints + streakBonus)
  } else {
    return Math.round(-basePoints)
  }
}

export function calculateOpponentAvgMMR(
  killerMMR: number,
  victimMMR: number,
  groupSize: number
): number {
  return (killerMMR + victimMMR) / 2
}