'use client'

import { memo } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { formatFame, formatSilver } from '@/lib/format'
import { TierBadge } from './TierBadge'

const RENDER_BASE = 'https://render.albiononline.com/v1/item'

function getItemIconUrl(type: string, quality?: number, size = 48) {
  return `${RENDER_BASE}/${type}.png?size=${size}${quality && quality > 1 ? `&quality=${quality}` : ''}`
}

export function PlayerAvatar({ name, weaponType }: { name: string; weaponType?: string | null }) {
  const url = weaponType ? getItemIconUrl(weaponType, 1, 64) : null
  return (
    <div className="w-10 h-10 rounded-lg bg-surface border border-border/80 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          className="w-full h-full object-contain scale-110"
          loading="lazy"
          decoding="async"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <span className="text-text-muted text-xs font-bold uppercase">{name.slice(0, 2)}</span>
      )}
    </div>
  )
}

export function CrossedSwords() {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" className="w-8 h-8 text-text-muted/50" fill="none" stroke="currentColor" strokeWidth="1.5">
        <g transform="rotate(45 12 12)">
          <path d="M12 3v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 16v3" stroke="#bfa15f" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="20" r="0.75" fill="#bfa15f" />
        </g>
        <g transform="rotate(-45 12 12)">
          <path d="M12 3v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 16v3" stroke="#bfa15f" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="20" r="0.75" fill="#bfa15f" />
        </g>
      </svg>
      <span className="absolute text-[7px] font-extrabold tracking-wider bg-[#0a0707] border border-border/80 rounded px-1 py-0.5 text-text-secondary select-none shadow-md">
        VS
      </span>
    </div>
  )
}

export interface KillData {
  id: number
  killTime: Date | string
  totalFame?: number | null
  fame: number
  mmrChange: number
  killerWeapon?: string | null
  victimWeapon?: string | null
  killerIp: number
  victimIp: number
  killer: { id: string; name: string; tier: string }
  victim: { id: string; name: string; tier: string }
  lootSilverValue?: number | null
}

export const KillCard = memo(function KillCard({ kill, isPlayerKiller, pName, pId, oName, oId }: {
  kill: KillData
  isPlayerKiller: boolean
  pName: string
  pId: string
  oName: string
  oId: string
}) {
  const role = isPlayerKiller ? 'KILL' : 'DEATH'
  const killerInfo = isPlayerKiller
    ? { name: pName, id: pId, tier: kill.killer.tier, ip: kill.killerIp }
    : { name: oName, id: oId, tier: kill.killer.tier, ip: kill.killerIp }
  const victimInfo = isPlayerKiller
    ? { name: oName, id: oId, tier: kill.victim.tier, ip: kill.victimIp }
    : { name: pName, id: pId, tier: kill.victim.tier, ip: kill.victimIp }
  const mmrChange = kill.mmrChange

  return (
    <Link
      href={`/kill/${kill.id}`}
      className="card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 relative border border-border/40 hover:border-accent/30 overflow-hidden group"
      style={{ contentVisibility: 'auto' }}
    >
      <span className={`absolute top-0 left-4 text-[9px] tracking-wider px-2 py-0.5 rounded-b font-extrabold uppercase border-x border-b border-white/10 shadow-md z-20 select-none ${role === 'KILL' ? 'bg-green-900/70 text-green-400' : 'bg-red-900/70 text-red-400'}`}>
        {role}
      </span>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-grow min-w-0 mt-1">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <PlayerAvatar name={killerInfo.name} weaponType={kill.killerWeapon} />
          <div className="min-w-0">
            {isPlayerKiller ? (
              <span className="font-bold text-sm text-text-primary truncate block">{killerInfo.name}</span>
            ) : (
              <Link
                href={`/player/${killerInfo.id}`}
                className="font-bold text-sm text-text-primary hover:text-accent transition-colors truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {killerInfo.name}
              </Link>
            )}
            <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
              <TierBadge tier={killerInfo.tier as any} size="sm" />
              {killerInfo.ip ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-border/80"></span>
                  <span className="text-text-secondary/80 font-medium">{killerInfo.ip} IP</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <CrossedSwords />

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <PlayerAvatar name={victimInfo.name} weaponType={kill.victimWeapon} />
          <div className="min-w-0">
            {isPlayerKiller ? (
              <Link
                href={`/player/${victimInfo.id}`}
                className="font-bold text-sm text-text-primary hover:text-accent transition-colors truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {victimInfo.name}
              </Link>
            ) : (
              <span className="font-bold text-sm text-text-primary truncate block">{victimInfo.name}</span>
            )}
            <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
              <TierBadge tier={victimInfo.tier as any} size="sm" />
              {victimInfo.ip ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-border/80"></span>
                  <span className="text-text-secondary/80 font-medium">{victimInfo.ip} IP</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start sm:items-end justify-center flex-shrink-0 text-left sm:text-right border-t border-border/20 sm:border-t-0 pt-2 sm:pt-0 sm:pl-4 min-w-[120px] gap-0.5 -mx-4 sm:mx-0 px-4 sm:px-0">
        <span className={`text-base font-extrabold tracking-tight ${mmrChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {mmrChange >= 0 ? '+' : ''}{mmrChange} MMR
        </span>
        <span className="text-xs text-accent/90 font-medium">
          {formatFame(kill.totalFame ?? kill.fame) ?? 'No'} fame
        </span>
        <span className="text-xs text-yellow-500/90 font-medium">
          {kill.lootSilverValue ? formatSilver(kill.lootSilverValue) : 'No'} silver
        </span>
        <span className="text-xs text-text-muted mt-0.5 select-none">
          {formatDistanceToNow(new Date(kill.killTime), { addSuffix: true })}
        </span>
      </div>
    </Link>
  )
})
