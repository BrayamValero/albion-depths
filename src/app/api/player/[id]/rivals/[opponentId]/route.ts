import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; opponentId: string }> }
) {
  try {
    const { id, opponentId } = await params

    const [player, opponent] = await Promise.all([
      prisma.player.findUnique({ where: { id } }),
      prisma.player.findUnique({ where: { id: opponentId } }),
    ])

    if (!player || !opponent) {
      return NextResponse.json({ error: 'Player or opponent not found' }, { status: 404 })
    }

    const [directKills, playerAssistKillIds, opponentAssistKillIds] = await Promise.all([
      prisma.kill.findMany({
        where: {
          OR: [
            { killerId: id, victimId: opponentId },
            { killerId: opponentId, victimId: id },
          ],
        },
        orderBy: { killTime: 'desc' },
        include: {
          killer: { select: { id: true, name: true, mmr: true } },
          victim: { select: { id: true, name: true, mmr: true } },
        },
      }),
      prisma.eventParticipant.findMany({
        where: { playerId: id, role: 'ASSISTER', kill: { victimId: opponentId } },
        select: { killId: true },
      }),
      prisma.eventParticipant.findMany({
        where: { playerId: opponentId, role: 'ASSISTER', kill: { victimId: id } },
        select: { killId: true },
      }),
    ])

    const includeClause = {
      killer: { select: { id: true, name: true, mmr: true } },
      victim: { select: { id: true, name: true, mmr: true } },
    } as const

    const [assistKillsByPlayer, assistKillsByOpponent] = await Promise.all([
      playerAssistKillIds.length > 0
        ? prisma.kill.findMany({
            where: { id: { in: playerAssistKillIds.map((e) => e.killId) } },
            include: includeClause,
          })
        : Promise.resolve([]),
      opponentAssistKillIds.length > 0
        ? prisma.kill.findMany({
            where: { id: { in: opponentAssistKillIds.map((e) => e.killId) } },
            include: includeClause,
          })
        : Promise.resolve([]),
    ])

    const mapKill = (k: typeof directKills[number], role: 'KILL' | 'DEATH') => ({
      id: k.id,
      eventId: k.eventId,
      role,
      mmrChange: k.mmrChange,
      killTime: k.killTime,
      fame: k.fame,
      totalFame: k.totalFame,
      killerWeapon: k.killerWeapon,
      victimWeapon: k.victimWeapon,
      killerIp: Math.round(k.killerIp ?? 0),
      victimIp: Math.round(k.victimIp ?? 0),
      killer: { id: k.killer.id, name: k.killer.name, tier: getTier(k.killer.mmr) },
      victim: { id: k.victim.id, name: k.victim.name, tier: getTier(k.victim.mmr) },
      lootSilverValue: k.lootSilverValue,
    })

    const killsByPlayer = [
      ...directKills.filter((k) => k.killerId === id).map((k) => mapKill(k, 'KILL')),
      ...assistKillsByPlayer.map((k) => mapKill(k, 'KILL')),
    ].sort((a, b) => new Date(b.killTime).getTime() - new Date(a.killTime).getTime())

    const killsByOpponent = [
      ...directKills.filter((k) => k.killerId === opponentId).map((k) => mapKill(k, 'DEATH')),
      ...assistKillsByOpponent.map((k) => mapKill(k, 'DEATH')),
    ].sort((a, b) => new Date(b.killTime).getTime() - new Date(a.killTime).getTime())

    return NextResponse.json({
      playerName: player.name,
      opponentName: opponent.name,
      killsByPlayer,
      killsByOpponent,
      total: killsByPlayer.length + killsByOpponent.length,
    })
  } catch (error) {
    console.error('Error fetching rival detail:', error)
    return NextResponse.json({ error: 'Failed to fetch rival detail' }, { status: 500 })
  }
}
