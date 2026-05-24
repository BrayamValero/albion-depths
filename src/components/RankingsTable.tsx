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
          {players.map((player) => (
            <tr
              key={player.id}
              className="border-b border-border hover:bg-surfaceHover transition-colors"
            >
              <td className="py-3 px-4">
                <span className="font-semibold">
                  {player.rank <= 3 ? (
                    <span className="text-accent">#{player.rank}</span>
                  ) : (
                    `#${player.rank}`
                  )}
                </span>
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
          ))}
        </tbody>
      </table>
    </div>
  )
}