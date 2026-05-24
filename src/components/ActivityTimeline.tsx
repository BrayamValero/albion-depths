'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { WeaponIcon } from './WeaponIcon'

interface TimelineEntry {
  id: number
  killId: number
  role: 'KILL' | 'DEATH' | 'ASSIST'
  subjectName: string
  subjectId: string
  otherName: string
  otherId: string
  mmrChange: number
  killTime: Date
  killerWeapon?: string | null
  victimWeapon?: string | null
  killerIp: number
  victimIp: number
}

interface Props {
  timeline: TimelineEntry[]
  playerName: string
}

type FilterKey = 'KILL' | 'DEATH' | 'ASSIST'

const FILTERS: { key: FilterKey; label: string; activeClass: string; inactiveClass: string }[] = [
  { key: 'KILL', label: 'Kills', activeClass: 'bg-green-900/50 text-green-400 border-green-700', inactiveClass: 'bg-surface border-border text-text-muted' },
  { key: 'DEATH', label: 'Deaths', activeClass: 'bg-red-900/50 text-red-400 border-red-700', inactiveClass: 'bg-surface border-border text-text-muted' },
  { key: 'ASSIST', label: 'Assists', activeClass: 'bg-blue-900/50 text-blue-400 border-blue-700', inactiveClass: 'bg-surface border-border text-text-muted' },
]

export function ActivityTimeline({ timeline, playerName }: Props) {
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>(['KILL', 'DEATH', 'ASSIST'])

  const toggle = (key: FilterKey) => {
    if (activeFilters.includes(key)) {
      if (activeFilters.length > 1) {
        setActiveFilters(activeFilters.filter((f) => f !== key))
      }
    } else {
      setActiveFilters([...activeFilters, key])
    }
  }

  const filterSet = new Set<FilterKey>(activeFilters)

  const filtered = timeline.filter((e) => filterSet.has(e.role))

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <div className="flex gap-1 ml-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => toggle(f.key)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filterSet.has(f.key) ? f.activeClass : f.inactiveClass
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div
              key={`${entry.role}-${entry.killId}`}
              className="card card-hover flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                {entry.role === 'KILL' && (
                  <>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/50 text-green-400 font-medium shrink-0">KILL</span>
                    <WeaponIcon type={entry.killerWeapon} />
                    <span className="font-medium text-accent">{playerName}</span>
                    <span className="text-text-muted text-xs">[{entry.killerIp}]</span>
                    <span className="text-text-muted text-xs">vs</span>
                    <WeaponIcon type={entry.victimWeapon} />
                    <Link href={`/player/${entry.subjectId}`} className="text-text-secondary hover:underline">
                      {entry.subjectName}
                    </Link>
                    <span className="text-text-muted text-xs">[{entry.victimIp}]</span>
                  </>
                )}
                {entry.role === 'DEATH' && (
                  <>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-400 font-medium shrink-0">DEATH</span>
                    <WeaponIcon type={entry.killerWeapon} />
                    <Link href={`/player/${entry.subjectId}`} className="font-medium text-accent hover:underline">
                      {entry.subjectName}
                    </Link>
                    <span className="text-text-muted text-xs">[{entry.killerIp}]</span>
                    <span className="text-text-muted text-xs">vs</span>
                    <WeaponIcon type={entry.victimWeapon} />
                    <span className="text-text-secondary">{playerName}</span>
                    <span className="text-text-muted text-xs">[{entry.victimIp}]</span>
                  </>
                )}
                {entry.role === 'ASSIST' && (
                  <>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400 font-medium shrink-0">ASSIST</span>
                    <span className="text-text-muted text-xs">vs</span>
                    <WeaponIcon type={entry.victimWeapon} />
                    <Link href={`/player/${entry.subjectId}`} className="text-text-secondary hover:underline">
                      {entry.subjectName}
                    </Link>
                    <span className="text-text-muted text-xs">[{entry.victimIp}]</span>
                  </>
                )}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/kill/${entry.killId}`} className="text-xs text-accent hover:underline">
                  Details
                </Link>
                <div className="text-right">
                  {entry.role === 'DEATH' ? (
                    <span className="text-red-500">{entry.mmrChange} MMR</span>
                  ) : (
                    <span className={entry.role === 'KILL' ? 'text-green-500' : 'text-blue-400'}>
                      +{entry.mmrChange} MMR
                    </span>
                  )}
                  <div className="text-text-muted text-xs">
                    {formatDistanceToNow(new Date(entry.killTime), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-text-muted">No activity recorded yet</div>
      )}
    </div>
  )
}
