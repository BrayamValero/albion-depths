'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { TierBadge } from './TierBadge'
import type { KillEvent, Tier } from '@/lib/types'

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
        <div
          key={kill.id}
          className="card card-hover flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Link
              href={`/player/${kill.killer.id}`}
              className="font-medium text-accent hover:underline"
            >
              {kill.killer.name}
            </Link>
            <span className="text-text-muted">vs</span>
            <Link
              href={`/player/${kill.victim.id}`}
              className="font-medium text-text-secondary hover:underline"
            >
              {kill.victim.name}
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span
              className={kill.mmrChange >= 0 ? 'text-green-500' : 'text-red-500'}
            >
              {kill.mmrChange >= 0 ? '+' : ''}{kill.mmrChange} MMR
            </span>
            <span className="text-text-muted">
              {formatDistanceToNow(new Date(kill.killTime), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}