import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params
    const seasonNumber = parseInt(number)
    if (isNaN(seasonNumber)) {
      return NextResponse.json({ error: 'Invalid season number' }, { status: 400 })
    }

    const season = await prisma.season.findUnique({
      where: { number: seasonNumber },
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    const snapshots = await prisma.seasonSnapshot.findMany({
      where: { seasonNumber },
      orderBy: { rank: 'asc' },
      select: {
        playerId: true,
        playerName: true,
        mmr: true,
        tier: true,
        rank: true,
        kills: true,
        deaths: true,
        assists: true,
      },
    })

    return NextResponse.json({
      season: {
        number: season.number,
        startsAt: season.startsAt,
        endsAt: season.endsAt,
        isActive: season.isActive,
      },
      players: snapshots,
      totalPlayers: snapshots.length,
    })
  } catch (error) {
    console.error('Season history error:', error)
    return NextResponse.json({ error: 'Failed to fetch season history' }, { status: 500 })
  }
}
