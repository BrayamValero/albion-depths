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
  const [isSyncing, setIsSyncing] = useState(false)
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

  const handleSync = async () => {
    setIsSyncing(true)
    setMessage('')

    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Synced ${data.synced} new kills`)
        mutate()
      } else {
        setMessage('Sync failed')
      }
    } catch {
      setMessage('Sync failed')
    } finally {
      setIsSyncing(false)
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
          onClick={handleSync}
          disabled={isSyncing}
          className="btn-primary disabled:opacity-50"
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
        <button
          onClick={handleResetSeason}
          disabled={isResetting}
          className="btn-secondary disabled:opacity-50"
        >
          {isResetting ? 'Resetting...' : 'Reset Season'}
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