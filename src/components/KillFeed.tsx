'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { TierBadge } from './TierBadge'
import { WeaponIcon } from './WeaponIcon'
import { formatSilver, formatFame } from '@/lib/format'
import type { KillEvent } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface KillFeedProps {
  limit?: number
}

export function KillFeed({ limit = 50 }: KillFeedProps) {
  const { data, error, isLoading } = useSWR<{ data: KillEvent[] }>(
    `/api/feed?limit=${limit}`,
    fetcher,
    { refreshInterval: 360000 }
  )

  if (isLoading) {
    return (
      <div className="text-center py-8 text-text-muted">Loading kill feed...</div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">Failed to load kill feed</div>
    )
  }

  if (!data?.data?.length) {
    return (
      <div className="text-center py-8 text-text-muted">
        No kills recorded yet. Wait for the sync job to fetch data.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.data.map((kill) => (
        <Link
          key={kill.id}
          href={`/kill/${kill.id}`}
          className="card card-hover flex items-center justify-between"
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/50 text-green-400 font-medium shrink-0">
              KILL
            </span>
            <span className="flex items-center gap-1">
              <WeaponIcon type={kill.killerWeapon} />
              <Link
                href={`/player/${kill.killer.id}`}
                className="font-medium text-accent hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {kill.killer.name}
              </Link>
              <TierBadge tier={kill.killer.tier as any} size="sm" />
              <span className="text-text-muted text-xs">[{kill.killerIp}]</span>
            </span>
            <span className="text-text-muted text-sm">vs</span>
            <span className="flex items-center gap-1">
              <WeaponIcon type={kill.victimWeapon} />
              <Link
                href={`/player/${kill.victim.id}`}
                className="font-medium text-text-secondary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {kill.victim.name}
              </Link>
              <TierBadge tier={kill.victim.tier as any} size="sm" />
              <span className="text-text-muted text-xs">[{kill.victimIp}]</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm shrink-0">
            {formatFame(kill.totalFame ?? kill.fame) && (
              <span className="text-purple-400" title="Fame">
                {formatFame(kill.totalFame ?? kill.fame)} fame
              </span>
            )}
            {formatSilver(kill.lootSilverValue) && (
              <span className="text-yellow-500" title="Loot value">
                {formatSilver(kill.lootSilverValue)}
              </span>
            )}
            <span
              className={kill.mmrChange >= 0 ? 'text-green-500' : 'text-red-500'}
            >
              {kill.mmrChange >= 0 ? '+' : ''}{kill.mmrChange} MMR
            </span>
            <span className="text-text-muted">
              {formatDistanceToNow(new Date(kill.killTime), { addSuffix: true })}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
