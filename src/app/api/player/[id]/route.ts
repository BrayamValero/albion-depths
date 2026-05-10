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

    const [recentKills, recentDeaths] = await Promise.all([
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
    ])

    return NextResponse.json({
      id: player.id,
      name: player.name,
      mmr: player.mmr,
      tier: getTier(player.mmr),
      kills: player.kills,
      deaths: player.deaths,
      kd: player.deaths > 0 ? Number((player.kills / player.deaths).toFixed(2)) : player.kills,
      streak: player.streak,
      peakMMR: player.mmr,
      recentKills: recentKills.map((k) => ({
        id: k.id,
        eventId: k.eventId,
        victim: {
          id: k.victim.id,
          name: k.victim.name,
          mmr: k.victim.mmr,
        },
        mmrChange: k.mmrChange,
        killTime: k.killTime,
        fame: k.fame,
      })),
      recentDeaths: recentDeaths.map((k) => ({
        id: k.id,
        eventId: k.eventId,
        killer: {
          id: k.killer.id,
          name: k.killer.name,
          mmr: k.killer.mmr,
        },
        mmrChange: k.mmrChange,
        killTime: k.killTime,
        fame: k.fame,
      })),
    })
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 })
  }
}