'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { TierBadge } from './TierBadge'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface SearchResult {
  id: string
  name: string
  mmr: number
  tier: string
}

interface SearchBarProps {
  onSelect?: (player: { id: string; name: string }) => void
  placeholder?: string
}

export function SearchBar({ onSelect, placeholder = 'Search players...' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data } = useSWR<{ data: SearchResult[] }>(
    query.length >= 2 ? `/api/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(player: SearchResult) {
    if (onSelect) {
      onSelect({ id: player.id, name: player.name })
      setQuery(player.name)
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="input w-full"
      />
      {isOpen && data?.data && data.data.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          {data.data.map((player) =>
            onSelect ? (
              <button
                key={player.id}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-surfaceHover transition-colors text-left"
                onClick={() => handleSelect(player)}
              >
                <span className="font-medium">{player.name}</span>
                <div className="flex items-center gap-2">
                  <TierBadge tier={player.tier as any} size="sm" />
                  <span className="text-text-muted text-sm">{player.mmr} MMR</span>
                </div>
              </button>
            ) : (
              <Link
                key={player.id}
                href={`/player/${player.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surfaceHover transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="font-medium">{player.name}</span>
                <div className="flex items-center gap-2">
                  <TierBadge tier={player.tier as any} size="sm" />
                  <span className="text-text-muted text-sm">{player.mmr} MMR</span>
                </div>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  )
}