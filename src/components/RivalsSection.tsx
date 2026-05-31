'use client'

import { useState, useMemo } from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import useSWR from 'swr'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface RivalEntry {
  opponentId: string
  opponentName: string
  killedByMe: number
  killedMe: number
}

interface RivalsSectionProps {
  playerId: string
  playerName: string
}

export function RivalsSection({ playerId, playerName }: RivalsSectionProps) {
  const [query, setQuery] = useState('')

  const { data, error, isLoading } = useSWR(
    `/api/player/${playerId}/rivals`,
    fetcher,
  )

  const rivals: RivalEntry[] = data?.data ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return rivals.filter((r) => r.opponentName.toLowerCase().includes(q))
  }, [rivals, query])

  return (
    <div>
      <h2 className="text-xl font-extrabold gothic-title text-text-primary mb-4">Rivals</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search rivals..."
        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent/50 transition-colors mb-4"
      />

      {isLoading && (
        <LoadingSpinner message="Loading rivals..." />
      )}

      {error && (
        <div className="text-center py-4 text-red-500">Failed to load rivals</div>
      )}

      {!isLoading && !error && query.trim() && filtered.length === 0 && (
        <div className="text-center py-4 text-text-muted card">No rivals match your search</div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((rival) => (
            <Link
              key={rival.opponentId}
              href={`/player/${playerId}/rivals/${rival.opponentId}`}
              className="card card-hover flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href={`/player/${rival.opponentId}`}
                  className="font-bold text-base text-text-primary hover:text-accent transition-colors truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {rival.opponentName}
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm shrink-0">
                <span className="text-red-400">
                  Has killed you {rival.killedMe} times
                </span>
                <span className="text-text-muted">/</span>
                <span className="text-green-400">
                  You killed them {rival.killedByMe} times
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
