'use client'

import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'
import { TierBadge } from './TierBadge'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface HeadToHeadProps {
  playerA: string
  playerB: string
}

export function HeadToHeadCard({ playerA, playerB }: HeadToHeadProps) {
  const { data, error, isLoading } = useSWR(
    `/api/h2h?playerA=${playerA}&playerB=${playerB}`,
    fetcher
  )

  if (isLoading) {
    return <div className="text-center py-8 text-text-muted">Loading...</div>
  }

  if (error || !data) {
    return <div className="text-center py-8 text-red-500">Failed to load head-to-head data</div>
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <Link href={`/player/${data.playerAId}`} className="text-xl font-bold text-accent hover:underline">
            {data.playerA}
          </Link>
        </div>
        <div className="text-text-muted px-4">vs</div>
        <div className="text-center flex-1">
          <Link href={`/player/${data.playerBId}`} className="text-xl font-bold text-text-secondary hover:underline">
            {data.playerB}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        <div>
          <div className="text-3xl font-bold text-green-500">{data.playerAKills}</div>
          <div className="text-text-muted text-sm">Kills</div>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-text-muted text-sm">-</span>
        </div>
        <div>
          <div className="text-3xl font-bold text-red-500">{data.playerBKills}</div>
          <div className="text-text-muted text-sm">Kills</div>
        </div>
      </div>

      {data.lastInteraction && (
        <div className="text-center text-text-muted text-sm">
          Last encounter: {formatDistanceToNow(new Date(data.lastInteraction), { addSuffix: true })}
        </div>
      )}
    </div>
  )
}