'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { KillCard } from './KillCard'
import { Pagination } from './Pagination'
import { LoadingSpinner } from './LoadingSpinner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface H2HKillListProps {
  playerA: string
  playerB: string
  playerAName: string
  playerBName: string
}

export function H2HKillList({ playerA, playerB, playerAName, playerBName }: H2HKillListProps) {
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)

  const { data, error, isLoading } = useSWR(
    `/api/player/${playerA}/rivals/${playerB}`,
    fetcher,
  )

  const allKillsByPlayer: any[] = data?.killsByPlayer ?? []
  const allKillsByOpponent: any[] = data?.killsByOpponent ?? []
  const total: number = data?.total ?? allKillsByPlayer.length + allKillsByOpponent.length
  const totalPages = Math.ceil(total / perPage)

  const { killsByPlayer, killsByOpponent } = useMemo(() => {
    const combined = [
      ...allKillsByPlayer.map((k: any) => ({ ...k, _side: 'player' as const })),
      ...allKillsByOpponent.map((k: any) => ({ ...k, _side: 'opponent' as const })),
    ].sort((a: any, b: any) => new Date(b.killTime).getTime() - new Date(a.killTime).getTime())

    const skip = (page - 1) * perPage
    const paged = combined.slice(skip, skip + perPage)

    return {
      killsByPlayer: paged.filter((k: any) => k._side === 'player').map(({ _side, ...rest }: any) => rest),
      killsByOpponent: paged.filter((k: any) => k._side === 'opponent').map(({ _side, ...rest }: any) => rest),
    }
  }, [allKillsByPlayer, allKillsByOpponent, page, perPage])

  if (isLoading) {
    return <div className="mt-8"><LoadingSpinner message="Loading kill details..." /></div>
  }

  if (error || !data) {
    return <div className="mt-8 text-center py-4 text-red-500">Failed to load kill details</div>
  }

  return (
    <div className="mt-8 space-y-8">
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(p) => { setPerPage(p); setPage(1) }}
        showPerPageSelector
      />

      <div className="border-t border-border/30 -mx-5 px-5 pt-8">
        <h2 className="text-lg font-semibold gothic-title mb-4 text-green-400">
          Times {playerAName} killed {playerBName} ({allKillsByPlayer.length})
        </h2>
        {allKillsByPlayer.length === 0 ? (
          <div className="card text-center py-4 text-text-muted">No kills recorded</div>
        ) : killsByPlayer.length === 0 ? (
          <div className="card text-center py-4 text-text-muted">No kills on this page</div>
        ) : (
          <div className="space-y-2">
            {killsByPlayer.map((k: any) => (
              <KillCard
                key={k.id}
                kill={k}
                isPlayerKiller={true}
                pName={playerAName}
                pId={playerA}
                oName={playerBName}
                oId={playerB}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border/30 -mx-5 px-5 pt-8">
        <h2 className="text-lg font-semibold gothic-title mb-4 text-red-400">
          Times {playerBName} killed {playerAName} ({allKillsByOpponent.length})
        </h2>
        {allKillsByOpponent.length === 0 ? (
          <div className="card text-center py-4 text-text-muted">No deaths recorded</div>
        ) : killsByOpponent.length === 0 ? (
          <div className="card text-center py-4 text-text-muted">No deaths on this page</div>
        ) : (
          <div className="space-y-2">
            {killsByOpponent.map((k: any) => (
              <KillCard
                key={k.id}
                kill={k}
                isPlayerKiller={false}
                pName={playerAName}
                pId={playerA}
                oName={playerBName}
                oId={playerB}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
