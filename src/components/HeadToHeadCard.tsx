'use client'

import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'
import { TierBadge } from './TierBadge'
import { LoadingSpinner } from './LoadingSpinner'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface HeadToHeadProps {
  playerA: string
  playerB: string
}

function PlayerCard({ name, id, mmr, tier, kills, deaths, opponentName, side }: {
  name: string
  id: string
  mmr: number
  tier: string
  kills: number
  deaths: number
  opponentName: string
  side: 'left' | 'right'
}) {
  const total = kills + deaths
  const winRate = total > 0 ? (kills / total) * 100 : 0

  return (
    <div className={`flex flex-col ${side === 'right' ? 'items-end' : ''}`}>
      <Link href={`/player/${id}`} className="text-lg font-bold text-text-primary hover:text-accent transition-colors">
        {name}
      </Link>
      <div className={`flex items-center gap-2 mt-0.5 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        <TierBadge tier={tier as any} size="sm" />
        <span className="text-text-muted text-sm tabular-nums">{mmr.toLocaleString()} MMR</span>
      </div>

      <div className={`flex items-center gap-4 mt-4 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500 tabular-nums">{kills}</div>
          <div className="text-text-muted text-xs">Kills</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500 tabular-nums">{deaths}</div>
          <div className="text-text-muted text-xs">Deaths</div>
        </div>
      </div>

      {total > 0 && (
        <div className={`flex items-center gap-2 mt-3 w-full ${side === 'right' ? 'flex-row-reverse' : ''}`}>
          <div className="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${winRate}%` }}
            />
          </div>
          <span className="text-xs text-text-muted tabular-nums">{winRate.toFixed(0)}%</span>
        </div>
      )}
    </div>
  )
}

export function HeadToHeadCard({ playerA, playerB }: HeadToHeadProps) {
  const { data, error, isLoading } = useSWR(
    `/api/h2h?playerA=${playerA}&playerB=${playerB}`,
    fetcher
  )

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />
  }

  if (error || !data) {
    return <div className="text-center py-8 text-red-500">Failed to load head-to-head data</div>
  }

  const aTotal = data.playerAKills + data.playerADeaths
  const bTotal = data.playerBKills + data.playerBDeaths
  const aWr = aTotal > 0 ? (data.playerAKills / aTotal) * 100 : 0
  const bWr = bTotal > 0 ? (data.playerBKills / bTotal) * 100 : 0

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-4">
        <PlayerCard
          name={data.playerA}
          id={data.playerAId}
          mmr={data.playerAMmr}
          tier={data.playerATier}
          kills={data.playerAKills}
          deaths={data.playerADeaths}
          opponentName={data.playerB}
          side="left"
        />

        <div className="flex flex-col items-center gap-2 px-4">
          <span className="text-xs uppercase font-bold tracking-widest text-text-muted">VS</span>
          <div className="flex flex-col items-center gap-1">
            <div className="text-sm font-semibold tabular-nums text-text-secondary">
              {aWr > bWr ? `${aWr.toFixed(0)}%` : `${bWr.toFixed(0)}%`}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">Win Rate</div>
          </div>
        </div>

        <PlayerCard
          name={data.playerB}
          id={data.playerBId}
          mmr={data.playerBMmr}
          tier={data.playerBTier}
          kills={data.playerBKills}
          deaths={data.playerBDeaths}
          opponentName={data.playerA}
          side="right"
        />
      </div>

      <div className="relative mt-6 h-2 rounded-full bg-surface overflow-hidden">
        <div
          className="absolute left-0 h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${aWr}%` }}
        />
        <div
          className="absolute right-0 h-full rounded-full bg-red-500 transition-all"
          style={{ width: `${100 - aWr}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-2 border-border shadow-md transition-all"
          style={{ left: `${aWr}%`, transform: `translate(-50%, -50%)` }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-green-500 font-semibold tabular-nums">{data.playerAKills} K</span>
        <span className="text-xs text-red-500 font-semibold tabular-nums">{data.playerBDeaths} K</span>
      </div>

      {data.lastInteraction && (
        <div className="text-center text-text-muted text-sm mt-6 pt-4 border-t border-border -mx-5 px-5">
          Last encounter: {formatDistanceToNow(new Date(data.lastInteraction), { addSuffix: true })}
        </div>
      )}
    </div>
  )
}
