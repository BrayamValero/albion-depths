import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const player = await prisma.player.findUnique({
      where: { id },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const [recentKills, recentDeaths, recentAssistEvents] = await Promise.all([
      prisma.kill.findMany({
        where: { killerId: id },
        orderBy: { killTime: 'desc' },
        take: 10,
        include: {
          victim: {
            select: { id: true, name: true, mmr: true },
          },
        },
      }),
      prisma.kill.findMany({
        where: { victimId: id },
        orderBy: { killTime: 'desc' },
        take: 10,
        include: {
          killer: {
            select: { id: true, name: true, mmr: true },
          },
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

    return NextResponse.json({
      id: player.id,
      name: player.name,
      mmr: player.mmr,
      tier: getTier(player.mmr),
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      kd: player.deaths > 0 ? Number(((player.kills + player.assists) / player.deaths).toFixed(2)) : (player.kills + player.assists),
      streak: player.streak,
      peakMMR: player.mmr,
      recentKills: recentKills.map((k) => ({
        id: k.id,
        eventId: k.eventId,
        role: 'KILL' as const,
        killer: { id: player.id, name: player.name, mmr: player.mmr, tier: getTier(player.mmr) },
        victim: { id: k.victim.id, name: k.victim.name, mmr: k.victim.mmr, tier: getTier(k.victim.mmr) },
        mmrChange: k.mmrChange,
        killTime: k.killTime,
        fame: k.fame,
        killerWeapon: k.killerWeapon,
        victimWeapon: k.victimWeapon,
        killerIp: Math.round(k.killerIp ?? 0),
        victimIp: Math.round(k.victimIp ?? 0),
      })),
      recentDeaths: recentDeaths.map((k) => ({
        id: k.id,
        eventId: k.eventId,
        role: 'DEATH' as const,
        killer: { id: k.killer.id, name: k.killer.name, mmr: k.killer.mmr, tier: getTier(k.killer.mmr) },
        victim: { id: player.id, name: player.name, mmr: player.mmr, tier: getTier(player.mmr) },
        mmrChange: k.mmrChange,
        killTime: k.killTime,
        fame: k.fame,
        killerWeapon: k.killerWeapon,
        victimWeapon: k.victimWeapon,
        killerIp: Math.round(k.killerIp ?? 0),
        victimIp: Math.round(k.victimIp ?? 0),
      })),
      recentAssists: recentAssistEvents.map((p) => ({
        id: p.kill.id,
        eventId: p.kill.eventId,
        role: 'ASSIST' as const,
        killer: { id: p.kill.killer.id, name: p.kill.killer.name, mmr: p.kill.killer.mmr, tier: getTier(p.kill.killer.mmr) },
        victim: { id: p.kill.victim.id, name: p.kill.victim.name, mmr: p.kill.victim.mmr, tier: getTier(p.kill.victim.mmr) },
        mmrChange: p.mmrChange,
        killTime: p.kill.killTime,
        fame: p.kill.fame,
        killerWeapon: p.kill.killerWeapon,
        victimWeapon: p.kill.victimWeapon,
        killerIp: Math.round(p.kill.killerIp ?? 0),
        victimIp: Math.round(p.kill.victimIp ?? 0),
      })),
    })
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 })
  }
}
