import { RankingsTable } from '@/components/RankingsTable'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'
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

  const where = tier
    ? {
        mmr: {
          gte: tier === 'Bronze' ? 900 : tier === 'Silver' ? 1200 : tier === 'Gold' ? 1500 : tier === 'Crystal' ? 2000 : 0,
          lt: tier === 'Iron' ? 900 : tier === 'Bronze' ? 1200 : tier === 'Silver' ? 1500 : tier === 'Gold' ? 2000 : 99999,
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
    kd: player.deaths > 0 ? Number((player.kills / player.deaths).toFixed(2)) : player.kills,
    streak: player.streak,
    rank: (page - 1) * limit + index + 1,
  }))

  const totalPages = Math.ceil(total / limit)
  const tiers: (Tier | undefined)[] = [undefined, 'Iron', 'Bronze', 'Silver', 'Gold', 'Crystal']

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