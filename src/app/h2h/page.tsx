'use client'

import { useState } from 'react'
import { HeadToHeadCard } from '@/components/HeadToHeadCard'
import { H2HKillList } from '@/components/H2HKillList'
import { SearchBar } from '@/components/SearchBar'

export default function H2HPage() {
  const [playerA, setPlayerA] = useState<{ id: string; name: string } | null>(null)
  const [playerB, setPlayerB] = useState<{ id: string; name: string } | null>(null)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight gothic-title text-text-primary">Head-to-Head</h1>
        <p className="text-text-muted mt-1">Compare kill history between two players</p>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-text-muted text-sm mb-2">Player A</label>
          <SearchBar
            onSelect={(p) => setPlayerA(p)}
            placeholder="Search for Player A..."
          />
        </div>

        <div className="flex justify-center">
          <span className="text-text-muted">vs</span>
        </div>

        <div>
          <label className="block text-text-muted text-sm mb-2">Player B</label>
          <SearchBar
            onSelect={(p) => setPlayerB(p)}
            placeholder="Search for Player B..."
          />
        </div>
      </div>

      {playerA && playerB && (
        <>
          <HeadToHeadCard playerA={playerA.id} playerB={playerB.id} />
          <H2HKillList
            playerA={playerA.id}
            playerB={playerB.id}
            playerAName={playerA.name}
            playerBName={playerB.name}
          />
        </>
      )}
    </div>
  )
}
