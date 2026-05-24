'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AdminStats {
  totalPlayers: number
  totalKills: number
  lastSyncAt: string | null
  lastSyncStatus: string | null
}

export function AdminPanel() {
  const [isResetting, setIsResetting] = useState(false)
  const [isResettingAll, setIsResettingAll] = useState(false)
  const [message, setMessage] = useState('')

  const { data, mutate } = useSWR<AdminStats>('/api/admin/stats', fetcher)

  const handleResetSeason = async () => {
    if (!confirm('Are you sure you want to reset all MMR to 1000? This cannot be undone.')) {
      return
    }

    setIsResetting(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/reset-season', { method: 'POST' })
      if (res.ok) {
        setMessage('Season reset successfully!')
        mutate()
      } else {
        setMessage('Failed to reset season')
      }
    } catch {
      setMessage('Failed to reset season')
    } finally {
      setIsResetting(false)
    }
  }

  const handleResetAll = async () => {
    if (!confirm('Are you sure you want to DELETE ALL DATA? This includes all players, kills, assists, and rankings.')) {
      return
    }
    if (!confirm('FINAL WARNING: This action cannot be undone. All data will be permanently lost.')) {
      return
    }

    setIsResettingAll(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/reset-all', { method: 'POST' })
      if (res.ok) {
        setMessage('All data has been wiped successfully!')
        mutate()
      } else {
        setMessage('Failed to reset all data')
      }
    } catch {
      setMessage('Failed to reset all data')
    } finally {
      setIsResettingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleResetSeason}
          disabled={isResetting}
          className="btn-secondary disabled:opacity-50"
        >
          {isResetting ? 'Resetting...' : 'Reset Season'}
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
        <div className="p-4 bg-surface border border-border rounded-lg text-text-secondary">
          {message}
        </div>
      )}
    </div>
  )
}
