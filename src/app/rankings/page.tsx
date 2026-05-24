import { RankingsTable } from '@/components/RankingsTable'
import { prisma } from '@/lib/prisma'
import { getTier, TIER_THRESHOLDS } from '@/lib/mmr'
import type { Tier } from '@/lib/types'
import Link from 'next/link'

export const metadata = {
  title: 'Rankings - Albion Depths Killboard',
  description: 'MMR rankings for The Depths',
}

interface Props {
  searchParams: Promise<{ page?: string; tier?: string }>
}

export default async function RankingsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 50
  const tier = params.tier as Tier | undefined

  const tierBounds: Record<string, { gte: number; lt: number }> = {}
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    const t = TIER_THRESHOLDS[i]
    const nextTier = TIER_THRESHOLDS[i - 1]
    tierBounds[t.tier] = { gte: t.minMMR, lt: nextTier?.minMMR ?? 99999 }
  }

  const where = tier
    ? {
        mmr: {
          gte: tierBounds[tier]?.gte ?? 0,
          lt: tierBounds[tier]?.lt ?? 99999,
        },
      }
    : {}

  const [players, total] = await Promise.all([
    prisma.player.findMany({
      where,
      orderBy: { mmr: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.player.count({ where }),
  ])

  const data = players.map((player, index) => ({
    id: player.id,
    name: player.name,
    mmr: player.mmr,
    tier: getTier(player.mmr),
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    kd: player.deaths > 0 ? Number(((player.kills + player.assists) / player.deaths).toFixed(2)) : (player.kills + player.assists),
    streak: player.streak,
    rank: (page - 1) * limit + index + 1,
  }))

  const totalPages = Math.ceil(total / limit)
  const tiers: (Tier | undefined)[] = [undefined, ...TIER_THRESHOLDS.map((t) => t.tier).reverse()]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Rankings</h1>
        <p className="text-text-muted mt-1">MMR leaderboard for The Depths</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tiers.map((t) => (
          <Link
            key={t || 'all'}
            href={`/rankings?page=1${t ? `&tier=${t}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tier === t
                ? 'bg-accent text-white'
                : 'bg-surface border border-border text-text-secondary hover:bg-surfaceHover'
            }`}
          >
            {t || 'All'}
          </Link>
        ))}
      </div>

      <RankingsTable players={data} />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`/rankings?page=${page - 1}${tier ? `&tier=${tier}` : ''}`}
              className="btn-secondary"
            >
              Previous
            </Link>
          )}
          <span className="text-text-muted self-center">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/rankings?page=${page + 1}${tier ? `&tier=${tier}` : ''}`}
              className="btn-secondary"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}