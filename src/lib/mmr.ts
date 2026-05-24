import { Tier } from './types'

export const STARTING_MMR = 1000
export const MIN_OPPONENT_MMR = 600
export const STREAK_BONUS_MAX = 0
export const STREAK_BONUS_PER_WIN = 0

export const TIER_THRESHOLDS: { tier: Tier; minMMR: number }[] = [
  { tier: 'Crystal', minMMR: 4000 },
  { tier: 'Emerald', minMMR: 3500 },
  { tier: 'Platinum', minMMR: 3000 },
  { tier: 'Gold', minMMR: 2500 },
  { tier: 'Silver', minMMR: 2000 },
  { tier: 'Bronze', minMMR: 1500 },
  { tier: 'Iron', minMMR: 1000 },
]

const TIER_K_FACTOR: Record<Tier, number> = {
  Iron: 20,
  Bronze: 18,
  Silver: 16,
  Gold: 14,
  Platinum: 12,
  Emerald: 10,
  Crystal: 8,
}

export function getKFactor(mmr: number): number {
  return TIER_K_FACTOR[getTier(mmr)]
}

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

  const k = getKFactor(playerMMR)
  const basePoints = k * (1 / (1 + Math.pow(10, (opponentAvgMMR - playerMMR) / 400)))
  const streakBonus = isWin ? Math.min(currentStreak * STREAK_BONUS_PER_WIN, STREAK_BONUS_MAX) : 0

  const change = isWin ? basePoints + streakBonus : -basePoints
  const rounded = Math.round(change)

  if (isWin && rounded === 0) return 1
  if (!isWin && rounded === 0) return -1
  return rounded
}

export function calculatePartyAvgMMR(members: { mmr: number }[]): number {
  if (members.length === 0) return 0
  return Math.round(members.reduce((sum, m) => sum + m.mmr, 0) / members.length)
}

