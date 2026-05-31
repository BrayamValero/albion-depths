import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'
import type { TimelineEntry } from '@/components/ActivityTimeline'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const take = Math.min(parseInt(searchParams.get('take') || '10'), 50)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0)
    const filterParam = searchParams.get('filter') || ''
    const allowedFilters = filterParam
      ? new Set(filterParam.split(',').map((s) => s.trim() as 'KILL' | 'DEATH' | 'ASSIST'))
      : new Set<('KILL' | 'DEATH' | 'ASSIST')>(['KILL', 'DEATH', 'ASSIST'])

    const player = await prisma.player.findUnique({ where: { id } })
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const queries: Promise<any>[] = []
    if (allowedFilters.has('KILL')) {
      queries.push(
        prisma.kill.findMany({
          where: { killerId: id },
          orderBy: { killTime: 'desc' },
          include: {
            victim: { select: { id: true, name: true, mmr: true } },
          },
        })
      )
    }
    if (allowedFilters.has('DEATH')) {
      queries.push(
        prisma.kill.findMany({
          where: { victimId: id },
          orderBy: { killTime: 'desc' },
          include: {
            killer: { select: { id: true, name: true, mmr: true } },
            participants: {
              where: { playerId: id, role: 'VICTIM' },
              select: { mmrChange: true },
            },
          },
        })
      )
    }
    if (allowedFilters.has('ASSIST')) {
      queries.push(
        prisma.eventParticipant.findMany({
          where: { playerId: id, role: 'ASSISTER' },
          orderBy: { kill: { killTime: 'desc' } },
          include: {
            kill: {
              include: {
                killer: { select: { id: true, name: true, mmr: true } },
                victim: { select: { id: true, name: true, mmr: true } },
              },
            },
          },
        })
      )
    }

    const results = await Promise.all(queries)

    let killIndex = 0
    const kills = allowedFilters.has('KILL') ? (results[killIndex++] as any[]) : []
    const deathKills = allowedFilters.has('DEATH') ? (results[killIndex++] as any[]) : []
    const assistEvents = allowedFilters.has('ASSIST') ? (results[killIndex++] as any[]) : []

    const timeline: TimelineEntry[] = [
      ...kills.map((k) => ({
        id: k.id,
        killId: k.id,
        role: 'KILL' as const,
        playerName: player.name,
        playerId: player.id,
        killer: { id: player.id, name: player.name, tier: getTier(player.mmr) },
        victim: { id: k.victim.id, name: k.victim.name, tier: getTier(k.victim.mmr) },
        mmrChange: k.mmrChange,
        killTime: k.killTime,
        totalFame: k.totalFame,
        lootSilverValue: k.lootSilverValue,
        killerWeapon: k.killerWeapon,
        victimWeapon: k.victimWeapon,
        killerIp: Math.round(k.killerIp ?? 0),
        victimIp: Math.round(k.victimIp ?? 0),
      })),
      ...deathKills.map((k) => ({
        id: k.id,
        killId: k.id,
        role: 'DEATH' as const,
        playerName: player.name,
        playerId: player.id,
        killer: { id: k.killer.id, name: k.killer.name, tier: getTier(k.killer.mmr) },
        victim: { id: player.id, name: player.name, tier: getTier(player.mmr) },
        mmrChange: k.participants[0]?.mmrChange ?? 0,
        killTime: k.killTime,
        totalFame: k.totalFame,
        lootSilverValue: k.lootSilverValue,
        killerWeapon: k.killerWeapon,
        victimWeapon: k.victimWeapon,
        killerIp: Math.round(k.killerIp ?? 0),
        victimIp: Math.round(k.victimIp ?? 0),
      })),
      ...assistEvents.map((p) => ({
        id: p.kill.id,
        killId: p.kill.id,
        role: 'ASSIST' as const,
        playerName: player.name,
        playerId: player.id,
        killer: { id: p.kill.killer.id, name: p.kill.killer.name, tier: getTier(p.kill.killer.mmr) },
        victim: { id: p.kill.victim.id, name: p.kill.victim.name, tier: getTier(p.kill.victim.mmr) },
        mmrChange: p.mmrChange,
        killTime: p.kill.killTime,
        totalFame: p.kill.totalFame,
        lootSilverValue: p.kill.lootSilverValue,
        killerWeapon: p.kill.killerWeapon,
        victimWeapon: p.kill.victimWeapon,
        killerIp: Math.round(p.kill.killerIp ?? 0),
        victimIp: Math.round(p.kill.victimIp ?? 0),
      })),
    ]

    timeline.sort((a, b) => new Date(b.killTime).getTime() - new Date(a.killTime).getTime())

    const total = timeline.length
    const data = timeline.slice(skip, skip + take)

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
