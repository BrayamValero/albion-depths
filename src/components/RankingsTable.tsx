'use client'

import Link from 'next/link'
import { TierBadge } from './TierBadge'
import type { PlayerWithMMR, Tier } from '@/lib/types'

interface RankingsTableProps {
  players: PlayerWithMMR[]
}

export function RankingsTable({ players }: RankingsTableProps) {
  if (!players.length) {
    return (
      <div className="text-center py-8 text-text-muted">
        No players found. Wait for the sync job to fetch data.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-text-muted font-medium">Rank</th>
            <th className="text-left py-3 px-4 text-text-muted font-medium">Player</th>
            <th className="text-left py-3 px-4 text-text-muted font-medium">Tier</th>
            <th className="text-right py-3 px-4 text-text-muted font-medium">MMR</th>
            <th className="text-right py-3 px-4 text-text-muted font-medium">K/D</th>
            <th className="text-right py-3 px-4 text-text-muted font-medium">Kills</th>
            <th className="text-right py-3 px-4 text-text-muted font-medium">Assists</th>
            <th className="text-right py-3 px-4 text-text-muted font-medium">Deaths</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const rankColor = player.rank === 1 ? 'text-yellow-500' : player.rank === 2 ? 'text-slate-300' : player.rank === 3 ? 'text-amber-600' : 'text-text-secondary'
            const rowBg = player.rank <= 3 ? 'bg-accent/[0.03]' : ''
            const rankLabel = player.rank === 1 ? '1ST' : player.rank === 2 ? '2ND' : player.rank === 3 ? '3RD' : `#${player.rank}`
            return (
              <tr
                key={player.id}
                className={`border-b border-border hover:bg-surfaceHover transition-colors ${rowBg}`}
              >
                <td className="py-3 px-4 w-20">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg border ${player.rank <= 3 ? 'border-accent/30 bg-accent/10' : 'border-border/60 bg-surface/50'} ${rankColor}`}>
                      <span className="text-sm font-black tracking-tight">{rankLabel}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/player/${player.id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {player.name}
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <TierBadge tier={player.tier} size="sm" />
                </td>
                <td className="py-3 px-4 text-right font-mono">{player.mmr}</td>
                <td className="py-3 px-4 text-right">{player.kd}</td>
                <td className="py-3 px-4 text-right text-green-500">{player.kills}</td>
                <td className="py-3 px-4 text-right text-blue-400">{player.assists}</td>
                <td className="py-3 px-4 text-right text-red-500">{player.deaths}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
