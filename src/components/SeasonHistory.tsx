'use client'

import useSWR from 'swr'
import { formatDistanceToNow, format } from 'date-fns'
import { LoadingSpinner } from './LoadingSpinner'
import { TierBadge } from './TierBadge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface SeasonHistoryProps {
  seasonNumber: number
  onBack: () => void
}

export function SeasonHistory({ seasonNumber, onBack }: SeasonHistoryProps) {
  const { data, error, isLoading } = useSWR(`/api/seasons/${seasonNumber}`, fetcher)

  if (isLoading) {
    return <LoadingSpinner message="Loading season data..." />
  }

  if (error || !data) {
    return <div className="text-red-500">Failed to load season data</div>
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-accent hover:underline inline-block">
        &larr; Back to Admin Panel
      </button>

      <div className="card">
        <h2 className="text-xl font-bold gothic-title mb-1">Season {data.season.number}</h2>
        <p className="text-text-muted text-sm">
          {format(new Date(data.season.startsAt), 'MMM d, yyyy')} &ndash; {format(new Date(data.season.endsAt), 'MMM d, yyyy')}
          &bull; {data.totalPlayers} players
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted border-b border-border/30">
              <th className="text-left py-3 px-2 font-medium w-12">#</th>
              <th className="text-left py-3 px-2 font-medium">Player</th>
              <th className="text-right py-3 px-2 font-medium">MMR</th>
              <th className="text-center py-3 px-2 font-medium">Tier</th>
              <th className="text-right py-3 px-2 font-medium">K</th>
              <th className="text-right py-3 px-2 font-medium">D</th>
              <th className="text-right py-3 px-2 font-medium">A</th>
            </tr>
          </thead>
          <tbody>
            {data.players.map((p: any) => (
              <tr key={p.playerId} className="border-b border-border/10 hover:bg-surface/50 transition-colors">
                <td className="py-2.5 px-2 text-text-secondary tabular-nums">{p.rank}</td>
                <td className="py-2.5 px-2 font-medium">{p.playerName}</td>
                <td className="py-2.5 px-2 text-right tabular-nums text-text-primary">{p.mmr.toLocaleString()}</td>
                <td className="py-2.5 px-2 text-center"><TierBadge tier={p.tier} size="sm" /></td>
                <td className="py-2.5 px-2 text-right tabular-nums text-green-500">{p.kills}</td>
                <td className="py-2.5 px-2 text-right tabular-nums text-red-500">{p.deaths}</td>
                <td className="py-2.5 px-2 text-right tabular-nums text-text-secondary">{p.assists}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
