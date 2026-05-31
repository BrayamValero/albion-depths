'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { KillCard, type KillData } from './KillCard'
import { Pagination } from './Pagination'

interface RivalDetailClientProps {
  playerId: string
  playerName: string
  opponentName: string
  killsByPlayer: KillData[]
  killsByOpponent: KillData[]
  backHref: string
  total?: number
}

export function RivalDetailClient({
  playerId,
  playerName,
  opponentName,
  killsByPlayer: allKillsByPlayer,
  killsByOpponent: allKillsByOpponent,
  backHref,
  total: totalProp,
}: RivalDetailClientProps) {
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const total = totalProp ?? allKillsByPlayer.length + allKillsByOpponent.length
  const totalPages = Math.ceil(total / perPage)

  const { killsByPlayer, killsByOpponent } = useMemo(() => {
    const combined = [
      ...allKillsByPlayer.map((k) => ({ ...k, _side: 'player' as const })),
      ...allKillsByOpponent.map((k) => ({ ...k, _side: 'opponent' as const })),
    ].sort((a, b) => new Date(b.killTime).getTime() - new Date(a.killTime).getTime())

    const skip = (page - 1) * perPage
    const paged = combined.slice(skip, skip + perPage)

    return {
      killsByPlayer: paged.filter((k) => k._side === 'player').map(({ _side, ...rest }) => rest),
      killsByOpponent: paged.filter((k) => k._side === 'opponent').map(({ _side, ...rest }) => rest),
    }
  }, [allKillsByPlayer, allKillsByOpponent, page, perPage])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href={backHref} className="text-sm text-accent hover:underline inline-block">
        &larr; Back to {playerName}
      </Link>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight gothic-title">Rivals: {playerName}</h1>
            <p className="text-text-muted mt-1">vs {opponentName}</p>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-500">{allKillsByPlayer.length}</div>
              <div className="text-xs text-text-muted">Your kills</div>
            </div>
            <span className="text-text-muted">-</span>
            <div>
              <div className="text-2xl font-bold text-red-500">{allKillsByOpponent.length}</div>
              <div className="text-xs text-text-muted">Your deaths</div>
            </div>
          </div>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(p) => { setPerPage(p); setPage(1) }}
        showPerPageSelector
      />

      <div>
        <h2 className="text-lg font-semibold gothic-title mb-4 text-green-400">
          Times you killed {opponentName} ({allKillsByPlayer.length})
        </h2>
        {killsByPlayer.length === 0 && allKillsByPlayer.length === 0 ? (
          <div className="card text-center py-4 text-text-muted">No kills recorded</div>
        ) : killsByPlayer.length === 0 && page === 1 ? (
          <div className="card text-center py-4 text-text-muted">No kills on this page</div>
        ) : (
          <div className="space-y-2">
            {killsByPlayer.map((k) => (
              <KillCard key={k.id} kill={k} isPlayerKiller={true} pName={playerName} pId={playerId} oName={opponentName} oId={opponentName} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold gothic-title mb-4 text-red-400">
          Times {opponentName} killed you ({allKillsByOpponent.length})
        </h2>
        {killsByOpponent.length === 0 && allKillsByOpponent.length === 0 ? (
          <div className="card text-center py-4 text-text-muted">No deaths recorded</div>
        ) : killsByOpponent.length === 0 && page === 1 ? (
          <div className="card text-center py-4 text-text-muted">No deaths on this page</div>
        ) : (
          <div className="space-y-2">
            {killsByOpponent.map((k) => (
              <KillCard key={k.id} kill={k} isPlayerKiller={false} pName={playerName} pId={playerId} oName={opponentName} oId={opponentName} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
