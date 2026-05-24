import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'
import { TierBadge } from '@/components/TierBadge'
import { ActivityTimeline } from '@/components/ActivityTimeline'

export const metadata = {
  title: 'Player Profile - Albion Depths Killboard',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params

  const player = await prisma.player.findUnique({
    where: { id },
  })

  if (!player) {
    notFound()
  }

  const [recentKills, recentDeaths, recentAssists] = await Promise.all([
    prisma.kill.findMany({
      where: { killerId: id },
      orderBy: { killTime: 'desc' },
      take: 10,
      include: {
        victim: { select: { id: true, name: true, mmr: true } },
      },
    }),
    prisma.kill.findMany({
      where: { victimId: id },
      orderBy: { killTime: 'desc' },
      take: 10,
      include: {
        killer: { select: { id: true, name: true, mmr: true } },
      },
    }),
    prisma.eventParticipant.findMany({
      where: { playerId: id, role: 'ASSISTER' },
      orderBy: { kill: { killTime: 'desc' } },
      take: 10,
      include: {
        kill: {
          include: {
            killer: { select: { id: true, name: true, mmr: true } },
            victim: { select: { id: true, name: true, mmr: true } },
          },
        },
      },
    }),
  ])

  type TimelineEntry = {
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

  const kills: TimelineEntry[] = recentKills.map((k) => ({
    id: k.id,
    killId: k.id,
    role: 'KILL' as const,
    subjectName: k.victim.name,
    subjectId: k.victim.id,
    otherName: player.name,
    otherId: player.id,
    mmrChange: k.mmrChange,
    killTime: k.killTime,
    killerWeapon: k.killerWeapon,
    victimWeapon: k.victimWeapon,
    killerIp: Math.round(k.killerIp ?? 0),
    victimIp: Math.round(k.victimIp ?? 0),
  }))

  const deaths: TimelineEntry[] = recentDeaths.map((k) => ({
    id: k.id,
    killId: k.id,
    role: 'DEATH' as const,
    subjectName: k.killer.name,
    subjectId: k.killer.id,
    otherName: player.name,
    otherId: player.id,
    mmrChange: k.mmrChange,
    killTime: k.killTime,
    killerWeapon: k.killerWeapon,
    victimWeapon: k.victimWeapon,
    killerIp: Math.round(k.killerIp ?? 0),
    victimIp: Math.round(k.victimIp ?? 0),
  }))

  const assists: TimelineEntry[] = recentAssists.map((p) => ({
    id: p.kill.id,
    killId: p.kill.id,
    role: 'ASSIST' as const,
    subjectName: p.kill.victim.name,
    subjectId: p.kill.victim.id,
    otherName: p.kill.killer.name,
    otherId: p.kill.killer.id,
    mmrChange: p.mmrChange,
    killTime: p.kill.killTime,
    killerWeapon: p.kill.killerWeapon,
    victimWeapon: p.kill.victimWeapon,
    killerIp: Math.round(p.kill.killerIp ?? 0),
    victimIp: Math.round(p.kill.victimIp ?? 0),
  }))

  const timeline = [...kills, ...deaths, ...assists].sort(
    (a, b) => new Date(b.killTime).getTime() - new Date(a.killTime).getTime()
  )

  const tier = getTier(player.mmr)
  const rank = await prisma.player.count({ where: { mmr: { gt: player.mmr } } })
  const totalScore = player.kills + player.assists
  const kd = player.deaths > 0 ? Number((totalScore / player.deaths).toFixed(2)) : totalScore

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{player.name}</h1>
            <p className="text-text-muted mt-1">Player Profile</p>
          </div>
          <div className="flex items-center gap-3">
            <TierBadge tier={tier} size="lg" />
            <span className="text-text-muted text-sm">#{rank + 1}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <div className="text-text-muted text-sm">MMR</div>
            <div className="text-2xl font-bold">{player.mmr}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">K+A/D</div>
            <div className="text-2xl font-bold">{kd}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">Kills</div>
            <div className="text-2xl font-bold text-green-500">{player.kills}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">Assists</div>
            <div className="text-2xl font-bold text-blue-400">{player.assists}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">Deaths</div>
            <div className="text-2xl font-bold text-red-500">{player.deaths}</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-text-muted text-sm">Current Win Streak</div>
          <div className="text-xl font-semibold">
            {player.streak > 0 ? `${player.streak} wins` : 'No active streak'}
          </div>
        </div>
      </div>

      <ActivityTimeline timeline={timeline} playerName={player.name} />
    </div>
  )
}
