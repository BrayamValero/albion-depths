'use client'

import { useState } from 'react'
import { HeadToHeadCard } from '@/components/HeadToHeadCard'
import { SearchBar } from '@/components/SearchBar'

export default function H2HPage() {
  const [playerA, setPlayerA] = useState('')
  const [playerB, setPlayerB] = useState('')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Head-to-Head</h1>
        <p className="text-text-muted mt-1">Compare kill history between two players</p>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-text-muted text-sm mb-2">Player A</label>
          <SearchBar
            onSelect={(p) => setPlayerA(p.id)}
            placeholder="Search for Player A..."
          />
        </div>

        <div className="flex justify-center">
          <span className="text-text-muted">vs</span>
        </div>

        <div>
          <label className="block text-text-muted text-sm mb-2">Player B</label>
          <SearchBar
            onSelect={(p) => setPlayerB(p.id)}
            placeholder="Search for Player B..."
          />
        </div>
      </div>

      {playerA && playerB && (
        <HeadToHeadCard playerA={playerA} playerB={playerB} />
      )}
    </div>
  )
}