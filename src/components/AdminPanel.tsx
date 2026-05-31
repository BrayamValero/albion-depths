'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { formatDistanceToNow, format } from 'date-fns'
import { SeasonHistory } from './SeasonHistory'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AdminStats {
  totalPlayers: number
  totalKills: number
  lastSyncAt: string | null
  lastSyncStatus: string | null
  activeSeason: { number: number; startsAt: string; endsAt: string } | null
  pastSeasons: { number: number; startsAt: string; endsAt: string; playerCount: number }[]
}

export function AdminPanel() {
  const [isEnding, setIsEnding] = useState(false)
  const [isResettingAll, setIsResettingAll] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [viewSeason, setViewSeason] = useState<number | null>(null)

  const { data, mutate } = useSWR<AdminStats>('/api/admin/stats', fetcher)

  const handleEndSeason = async () => {
    if (!data?.activeSeason) return

    const msg = `End Season ${data.activeSeason.number}?\n\nThis will:\n• Snapshot all ${data.totalPlayers} players (MMR, rank, K/D/A)\n• Close the current season\n• Start Season ${data.activeSeason.number + 1}\n• Reset all MMR to 1000\n• Clear all player stats and Head-to-Head records\n\nKill history will be preserved.\n\nThis cannot be undone.`

    if (!confirm(msg)) return

    setIsEnding(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/end-season', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setMessage({ text: json.message, type: 'success' })
        mutate()
      } else {
        setMessage({ text: json.error || 'Failed to end season', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Failed to end season', type: 'error' })
    } finally {
      setIsEnding(false)
    }
  }

  const handleResetAll = async () => {
    if (!confirm('Are you sure you want to DELETE ALL DATA? This includes all players, kills, assists, and rankings.')) return
    if (!confirm('FINAL WARNING: This action cannot be undone. All data will be permanently lost.')) return

    setIsResettingAll(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/reset-all', { method: 'POST' })
      if (res.ok) {
        setMessage({ text: 'All data has been wiped successfully!', type: 'success' })
        mutate()
      } else {
        setMessage({ text: 'Failed to reset all data', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Failed to reset all data', type: 'error' })
    } finally {
      setIsResettingAll(false)
    }
  }

  if (viewSeason) {
    return <SeasonHistory seasonNumber={viewSeason} onBack={() => setViewSeason(null)} />
  }

  const activeSeason = data?.activeSeason
  const seasonEnd = activeSeason ? formatDistanceToNow(new Date(activeSeason.endsAt), { addSuffix: true }) : null
  const daysLeft = activeSeason
    ? Math.ceil((new Date(activeSeason.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-text-muted text-sm">Total Players</div>
          <div className="text-2xl font-bold mt-1">{data?.totalPlayers ?? '-'}</div>
        </div>
        <div className="card">
          <div className="text-text-muted text-sm">Total Kills</div>
          <div className="text-2xl font-bold mt-1">{data?.totalKills ?? '-'}</div>
        </div>
        <div className="card">
          <div className="text-text-muted text-sm">Last Sync</div>
          <div className="text-lg font-medium mt-1">
            {data?.lastSyncAt
              ? formatDistanceToNow(new Date(data.lastSyncAt), { addSuffix: true })
              : 'Never'}
          </div>
          <div className={`text-sm ${data?.lastSyncStatus === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {data?.lastSyncStatus ?? 'No sync yet'}
          </div>
        </div>
        <div className="card">
          <div className="text-text-muted text-sm">Active Season</div>
          {activeSeason ? (
            <>
              <div className="text-lg font-bold mt-1">Season {activeSeason.number}</div>
              <div className="text-xs text-text-muted mt-0.5">
                {daysLeft !== null && daysLeft > 0
                  ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
                  : 'Ending today'}
              </div>
            </>
          ) : (
            <div className="text-lg font-medium mt-1 text-text-muted">No active season</div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleEndSeason}
          disabled={isEnding || !activeSeason}
          className="btn-secondary disabled:opacity-50"
        >
          {isEnding ? 'Ending Season...' : activeSeason ? `End Season ${activeSeason.number}` : 'No Active Season'}
        </button>
        <button
          onClick={handleResetAll}
          disabled={isResettingAll}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-red-900/50 text-red-400 border border-red-800 hover:bg-red-900 transition-colors disabled:opacity-50"
        >
          {isResettingAll ? 'Wiping...' : 'Wipe All Data'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border text-sm ${message.type === 'success' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
          {message.text}
        </div>
      )}

      {data?.pastSeasons && data.pastSeasons.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold gothic-title mb-3">Past Seasons</h3>
          <div className="space-y-2">
            {data.pastSeasons.map((s) => (
              <button
                key={s.number}
                onClick={() => setViewSeason(s.number)}
                className="w-full card card-hover flex items-center justify-between p-4 text-left"
              >
                <div>
                  <span className="font-semibold">Season {s.number}</span>
                  <span className="text-text-muted text-sm ml-3">
                    {format(new Date(s.startsAt), 'MMM d, yyyy')} &ndash; {format(new Date(s.endsAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-text-muted text-sm">{s.playerCount} players</span>
                  <span className="text-accent text-sm font-medium">View &rarr;</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
