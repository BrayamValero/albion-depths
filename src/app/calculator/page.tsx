'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { LoadingSpinner } from '@/components/LoadingSpinner'

function parseSilver(raw: string): number {
  const s = raw.trim().toLowerCase()
  if (!s) return 0
  if (s.endsWith('m')) return parseFloat(s.slice(0, -1)) * 1_000_000
  if (s.endsWith('k')) return parseFloat(s.slice(0, -1)) * 1_000
  return parseFloat(s) || 0
}

function format(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`
  return val.toLocaleString()
}

export default function CalculatorPage() {
  const [player, setPlayer] = useState<{ id: string; name: string } | null>(null)
  const [groups, setGroups] = useState<string[][]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string[] | null>(null)
  const [amounts, setAmounts] = useState<string[]>([])
  const [result, setResult] = useState<{
    total: number
    target: number
    details: { name: string; value: number }[]
    trades: { from: string; to: string; amount: number }[]
  } | null>(null)

  const handleSelect = async (p: { id: string; name: string }) => {
    setPlayer(p)
    setSelectedGroup(null)
    setAmounts([])
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: p.id }),
      })
      const data = await res.json()
      setGroups(data.groups ?? [])
    } catch {
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const handleGroupSelect = (group: string[]) => {
    setSelectedGroup(group)
    setAmounts(group.map(() => ''))
    setResult(null)
  }

  const handleCalculate = () => {
    if (!selectedGroup) return
    const details = selectedGroup.map((name, i) => ({
      name,
      value: parseSilver(amounts[i] || '0'),
    }))
    const total = details.reduce((a, b) => a + b.value, 0)
    if (total <= 0) return
    const target = total / details.length

    const givers = details
      .map((d) => ({ ...d, balance: d.value - target }))
      .filter((p) => p.balance > 0)
    const receivers = details
      .map((d) => ({ ...d, balance: d.value - target }))
      .filter((p) => p.balance < 0)

    const trades: { from: string; to: string; amount: number }[] = []
    let gi = 0, ri = 0
    while (gi < givers.length && ri < receivers.length) {
      const give = givers[gi]
      const receive = receivers[ri]
      const amount = Math.min(give.balance, -receive.balance)
      trades.push({ from: give.name, to: receive.name, amount: Math.round(amount) })
      give.balance -= amount
      receive.balance += amount
      if (give.balance <= 0.01) gi++
      if (receive.balance >= -0.01) ri++
    }

    setResult({ total, target: Math.round(target), details, trades })
  }

  const hasError = selectedGroup !== null && amounts.some((a) => {
    const v = a.trim().toLowerCase()
    return v !== '' && !/^\d+(\.\d+)?[mk]?$/.test(v)
  })

  const totalEntered = amounts.reduce((s, a) => s + parseSilver(a), 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight gothic-title text-text-primary">Calculator</h1>
        <p className="text-text-muted text-sm mt-1">
          Split Abyssal Depths silver evenly between your party
        </p>
      </div>

      {!player && (
        <div>
          <label className="block text-text-muted text-sm mb-2">Your Albion name</label>
          <SearchBar
            onSelect={handleSelect}
            placeholder="Search your Albion name..."
          />
        </div>
      )}

      {player && (
        <div className="flex items-center gap-3 card p-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-medium text-text-primary text-sm">{player.name}</p>
          </div>
          <button
            onClick={() => {
              setPlayer(null)
              setGroups([])
              setSelectedGroup(null)
              setAmounts([])
              setResult(null)
            }}
            className="text-xs text-text-muted hover:text-red-400 transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {!loading && groups.length === 0 && player && (
        <div className="card p-8 text-center">
          <p className="text-text-muted">No recent party groups found. Join some Depths runs first!</p>
        </div>
      )}

      {!loading && groups.length > 0 && !selectedGroup && (
        <div>
          <p className="text-text-muted text-sm mb-3">Select a party from your recent kills:</p>
          <div className="grid grid-cols-1 gap-3">
            {groups.slice(0, 10).map((group, i) => (
              <button
                key={i}
                onClick={() => handleGroupSelect(group)}
                className="card card-hover group p-4 text-left transition-all duration-200 hover:border-accent/40 cursor-pointer"
              >
                <div className="text-xs text-text-muted mb-1">Group {i + 1}</div>
                <div className="text-text-primary text-sm font-medium">
                  {group.join(', ')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedGroup && !result && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary text-sm">Enter silver amounts</h3>
            <button
              onClick={() => { setSelectedGroup(null); setAmounts([]) }}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              Change group
            </button>
          </div>

          {selectedGroup.map((name, i) => (
            <div key={name}>
              <label className="block text-text-muted text-xs mb-1">{name}</label>
              <input
                type="text"
                value={amounts[i]}
                onChange={(e) => {
                  const next = [...amounts]
                  next[i] = e.target.value
                  setAmounts(next)
                  setResult(null)
                }}
                placeholder="e.g. 1.5m, 500k, 2500000"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-text-muted">
              Total: <span className="font-mono text-text-primary">{format(totalEntered)}</span>
            </span>
            <button
              onClick={handleCalculate}
              disabled={hasError || totalEntered <= 0}
              className="px-5 py-2 rounded-lg bg-accent hover:bg-accent/80 disabled:bg-surfaceHover disabled:text-text-muted/50 text-white font-medium text-sm transition-colors disabled:cursor-not-allowed cursor-pointer"
            >
              Calculate
            </button>
          </div>
          {hasError && (
            <p className="text-xs text-red-400">Invalid input. Use plain numbers with optional k or m suffix.</p>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Split Results</h3>
              <button
                onClick={() => setResult(null)}
                className="text-xs text-text-muted hover:text-accent transition-colors"
              >
                Recalculate
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-border">
              <div>
                <div className="text-text-muted text-xs">Total Silver</div>
                <div className="text-2xl font-bold text-text-primary">{format(result.total)}</div>
              </div>
              <div>
                <div className="text-text-muted text-xs">Each Pays</div>
                <div className="text-2xl font-bold text-accent">{format(result.target)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {result.details.map((d) => (
                <div key={d.name} className="bg-surface/50 rounded-lg p-3 text-center border border-border/40">
                  <div className="text-xs text-text-muted mb-1 truncate">{d.name}</div>
                  <div className="text-sm font-mono font-medium">{format(d.value)}</div>
                  <div className={`text-xs mt-1 ${d.value >= result.target ? 'text-green-500' : 'text-red-400'}`}>
                    {d.value >= result.target ? '+' : ''}{format(d.value - result.target)}
                  </div>
                </div>
              ))}
            </div>

            {result.trades.length > 0 && (
              <div>
                <div className="text-text-muted text-xs mb-3">Trade Instructions</div>
                <div className="space-y-2">
                  {result.trades.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-surface/50 rounded-lg px-4 py-3 border border-border/40"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-text-primary">{t.from}</span>
                        <span className="text-text-muted">&rarr;</span>
                        <span className="font-medium text-text-primary">{t.to}</span>
                      </div>
                      <span className="font-mono text-sm text-yellow-500 font-medium">
                        {format(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
