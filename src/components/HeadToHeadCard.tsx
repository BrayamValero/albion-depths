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
      <div className="grid grid-cols-5 gap-4 items-center mb-6">
        <div className="text-center col-span-2">
          <Link href={`/player/${data.playerAId}`} className="text-xl font-bold text-accent hover:underline">
            {data.playerA}
          </Link>
          <div className="flex items-center justify-center gap-2 mt-1">
            <TierBadge tier={data.playerATier} size="sm" />
            <span className="text-text-muted text-sm">{data.playerAMmr} MMR</span>
          </div>
        </div>
        <div className="text-center text-text-muted font-medium">VS</div>
        <div className="text-center col-span-2">
          <Link href={`/player/${data.playerBId}`} className="text-xl font-bold text-text-secondary hover:underline">
            {data.playerB}
          </Link>
          <div className="flex items-center justify-center gap-2 mt-1">
            <TierBadge tier={data.playerBTier} size="sm" />
            <span className="text-text-muted text-sm">{data.playerBMmr} MMR</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="text-center border-r border-border pr-4">
          <div className="mb-3">
            <div className="text-3xl font-bold text-green-500">{data.playerAKills}</div>
            <div className="text-text-muted text-sm">Kills (vs {data.playerB})</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-500">{data.playerADeaths}</div>
            <div className="text-text-muted text-sm">Deaths (by {data.playerB})</div>
          </div>
        </div>
        <div className="text-center">
          <div className="mb-3">
            <div className="text-3xl font-bold text-green-500">{data.playerBKills}</div>
            <div className="text-text-muted text-sm">Kills (vs {data.playerA})</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-500">{data.playerBDeaths}</div>
            <div className="text-text-muted text-sm">Deaths (by {data.playerA})</div>
          </div>
        </div>
      </div>

      {data.lastInteraction && (
        <div className="text-center text-text-muted text-sm mt-6 pt-4 border-t border-border">
          Last encounter: {formatDistanceToNow(new Date(data.lastInteraction), { addSuffix: true })}
        </div>
      )}
    </div>
  )
}