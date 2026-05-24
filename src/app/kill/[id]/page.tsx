'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { TierBadge } from '@/components/TierBadge'
import { formatSilver, formatFame } from '@/lib/format'

const fetcher = (url: string) => fetch(url).then((res) => res.json())
const RENDER_BASE = 'https://render.albiononline.com/v1/item'

const EQUIP_LABELS: Record<string, string> = {
  MainHand: 'Main Hand',
  OffHand: 'Off Hand',
  Head: 'Head',
  Armor: 'Chest',
  Shoes: 'Shoes',
  Bag: 'Bag',
  Cape: 'Cape',
  Mount: 'Mount',
  Potion: 'Potion',
  Food: 'Food',
}

const EQUIP_ORDER = ['MainHand', 'OffHand', 'Head', 'Armor', 'Shoes', 'Bag', 'Cape', 'Mount', 'Potion', 'Food']

function ItemIcon({ type, size = 48, quality }: { type?: string | null; size?: number; quality?: number }) {
  if (!type) return null
  return (
    <img
      src={`${RENDER_BASE}/${type}.png?size=${size}${quality && quality > 1 ? `&quality=${quality}` : ''}`}
      alt={type}
      className="inline-block"
      style={{ width: size, height: size }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

interface KillDetail {
  id: number
  eventId: string
  killTime: string
  fame: number
  totalFame: number | null
  mmrChange: number
  killer: { id: string; name: string; mmr: number; tier: string; guild?: string; alliance?: string; ip: number }
  victim: { id: string; name: string; mmr: number; tier: string; guild?: string; alliance?: string; ip: number }
  killerWeapon: string | null
  victimWeapon: string | null
  killerEquipment: Record<string, { Type: string; Count?: number; Quality?: number } | null>
  killerGearValue: number
  victimEquipment: Record<string, { Type: string; Count?: number; Quality?: number } | null>
  victimGearValue: number
  victimInventory: { Type: string; Count: number; Quality: number }[]
  lootTotalCount: number
  lootSilverValue: number | null
  participants: { id: string; name: string; mmr: number; tier: string; role: string; mmrChange: number; damageDone: number; healingDone: number; ip: number; equipment: Record<string, { Type: string; Count?: number; Quality?: number } | null> }[]
  groupMemberCount: number | null
  killerPartyMmr: number | null
  killerPartySize: number | null
  killerPartyMembers: { id: string; name: string; mmr: number; tier: string }[]
  location: string | null
  killArea: string | null
  battleId: string | null
}

export default function KillPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { data, error, isLoading } = useSWR<KillDetail>(`/api/kill/${id}`, fetcher)

  if (isLoading) {
    return <div className="text-center py-8 text-text-muted">Loading kill details...</div>
  }

  if (error || !data) {
    return <div className="text-center py-8 text-red-500">Failed to load kill details</div>
  }

  const killerParticipant = data.participants.find((p) => p.role === 'KILLER')
  const victimParticipant = data.participants.find((p) => p.role === 'VICTIM')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
          <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link href={`/player/${data.killer.id}`} className="flex items-center gap-2 hover:underline">
              <ItemIcon type={data.killerWeapon} size={32} />
              <div>
                <span className="text-xl font-bold text-accent">{data.killer.name}</span>
                <span className="text-text-muted text-xs ml-1">[{data.killer.ip}]</span>
                {killerParticipant && killerParticipant.damageDone > 0 && (
                  <div className="text-xs text-text-muted">{killerParticipant.damageDone.toLocaleString()} dmg</div>
                )}
              </div>
            </Link>
            <TierBadge tier={data.killer.tier as any} size="sm" />
            <span className="text-text-muted text-sm">({data.killer.mmr} MMR)</span>
          </div>
          <span className="text-text-muted text-lg font-medium px-4">VS</span>
          <div className="flex items-center gap-3">
            <Link href={`/player/${data.victim.id}`} className="flex items-center gap-2 hover:underline">
              <div className="text-right">
                <span className="text-xl font-bold text-text-secondary">{data.victim.name}</span>
                <span className="text-text-muted text-xs ml-1">[{data.victim.ip}]</span>
                {victimParticipant && victimParticipant.damageDone > 0 && (
                  <div className="text-xs text-text-muted">{victimParticipant.damageDone.toLocaleString()} dmg</div>
                )}
              </div>
              <ItemIcon type={data.victimWeapon} size={32} />
            </Link>
            <TierBadge tier={data.victim.tier as any} size="sm" />
            <span className="text-text-muted text-sm">({data.victim.mmr} MMR)</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-text-muted mt-4 pt-4 border-t border-border">
          <div className="flex gap-6">
            {data.killer.guild && <span>Guild: {data.killer.guild}</span>}
            {data.location && <span>Location: {data.location}</span>}
            {data.killerPartySize && data.killerPartySize > 1 ? (
              <span>Party of {data.killerPartySize} (Avg {data.killerPartyMmr} MMR)</span>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <span className={data.mmrChange >= 0 ? 'text-green-500' : 'text-red-500'}>
              {data.mmrChange >= 0 ? '+' : ''}{data.mmrChange} MMR
            </span>
            <div>{formatDistanceToNow(new Date(data.killTime), { addSuffix: true })}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-accent">{data.killer.name}&apos;s Equipment</h3>
          <div className="grid grid-cols-5 gap-3">
            {EQUIP_ORDER.map((slot) => {
              const item = data.killerEquipment[slot]
              if (!item) return null
              return (
                <div key={slot} className="flex flex-col items-center gap-1">
                  <div className="bg-surface border border-border rounded-lg p-2">
                    <ItemIcon type={item.Type} size={40} quality={item.Quality} />
                  </div>
                  <span className="text-xs text-text-muted text-center leading-tight">{EQUIP_LABELS[slot]}</span>
                </div>
              )
            })}
          </div>
          {formatSilver(data.killerGearValue) && (
            <div className="mt-3 text-xs text-text-muted text-right">
              Gear value: <span className="text-yellow-500">{formatSilver(data.killerGearValue)}</span>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-red-400">{data.victim.name}&apos;s Equipment</h3>
          <div className="grid grid-cols-5 gap-3">
            {EQUIP_ORDER.map((slot) => {
              const item = data.victimEquipment[slot]
              if (!item) return null
              return (
                <div key={slot} className="flex flex-col items-center gap-1">
                  <div className="bg-surface border border-border rounded-lg p-2">
                    <ItemIcon type={item.Type} size={40} quality={item.Quality} />
                  </div>
                  <span className="text-xs text-text-muted text-center leading-tight">{EQUIP_LABELS[slot]}</span>
                </div>
              )
            })}
          </div>
          {formatSilver(data.victimGearValue) && (
            <div className="mt-3 text-xs text-text-muted text-right">
              Gear value: <span className="text-yellow-500">{formatSilver(data.victimGearValue)}</span>
            </div>
          )}
        </div>
      </div>

      {data.killerPartyMembers && data.killerPartyMembers.length > 1 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Killer&apos;s Party</h3>
          <div className="space-y-2">
            {data.killerPartyMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <Link href={`/player/${m.id}`} className="font-medium text-accent hover:underline">{m.name}</Link>
                <TierBadge tier={m.tier as any} size="sm" />
                <span className="text-text-muted text-sm">{m.mmr} MMR</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.victimInventory.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Loot Dropped</h3>
            <div className="flex items-center gap-3">
              <span className="text-yellow-500 font-medium">{data.lootTotalCount} items</span>
            </div>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {data.victimInventory.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="bg-surface border border-border rounded-lg p-1 relative">
                  <ItemIcon type={item.Type} size={36} quality={item.Quality} />
                  {item.Count > 1 && (
                    <span className="absolute -bottom-1 -right-1 text-xs bg-surfaceHover rounded px-0.5">{item.Count}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border text-xs text-text-muted flex justify-between">
            <span>Fame: {formatFame(data.totalFame ?? data.fame) ?? 0}</span>
            {formatSilver(data.lootSilverValue) && (
              <span className="text-yellow-500">{formatSilver(data.lootSilverValue)}</span>
            )}
          </div>
        </div>
      )}

      {data.participants.length > 1 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Participants</h3>
          <div className="space-y-4">
            {data.participants.filter((p) => p.role !== 'VICTIM').map((p) => {
              const equipItems = EQUIP_ORDER.filter((s) => p.equipment[s]).length
              return (
                <div key={p.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {p.role === 'KILLER' && <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/50 text-green-400 font-medium">KILLER</span>}
                      {p.role === 'ASSISTER' && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400 font-medium">ASSIST</span>}
                      <Link href={`/player/${p.id}`} className="font-medium text-accent hover:underline">{p.name}</Link>
                      <span className="text-text-muted text-xs">[{p.ip}]</span>
                      <TierBadge tier={p.tier as any} size="sm" />
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {p.damageDone > 0 && <span className="text-text-muted">{p.damageDone.toLocaleString()} dmg</span>}
                      {p.healingDone > 0 && <span className="text-text-muted">{p.healingDone.toLocaleString()} heal</span>}
                      <span className={p.mmrChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {p.mmrChange >= 0 ? '+' : ''}{p.mmrChange} MMR
                      </span>
                    </div>
                  </div>
                  {equipItems > 0 && (
                    <div className="flex items-center gap-2 mt-2 ml-12">
                      {EQUIP_ORDER.map((slot) => {
                        const item = p.equipment[slot]
                        if (!item) return null
                        return (
                          <div key={slot} className="flex flex-col items-center gap-0.5">
                            <div className="bg-surface border border-border rounded p-1">
                              <ItemIcon type={item.Type} size={28} quality={item.Quality} />
                            </div>
                            <span className="text-[10px] text-text-muted leading-none">{EQUIP_LABELS[slot]}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
