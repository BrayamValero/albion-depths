import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [totalPlayers, totalKills, lastSync, activeSeason, pastSeasons] = await Promise.all([
      prisma.player.count(),
      prisma.kill.count(),
      prisma.syncLog.findFirst({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.season.findFirst({
        where: { isActive: true },
      }),
      prisma.season.findMany({
        where: { isActive: false },
        orderBy: { number: 'desc' },
        include: {
          _count: { select: { snapshots: true } },
        },
      }),
    ])

    // Auto-bootstrap Season 1 if no seasons exist
    let effectiveActiveSeason = activeSeason
    if (!activeSeason && pastSeasons.length === 0) {
      effectiveActiveSeason = await prisma.season.create({
        data: {
          number: 1,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      })
    }

    return NextResponse.json({
      totalPlayers,
      totalKills,
      lastSyncAt: lastSync?.createdAt || null,
      lastSyncStatus: lastSync?.status || null,
      activeSeason: effectiveActiveSeason
        ? {
            number: effectiveActiveSeason.number,
            startsAt: effectiveActiveSeason.startsAt,
            endsAt: effectiveActiveSeason.endsAt,
          }
        : null,
      pastSeasons: pastSeasons.map((s) => ({
        number: s.number,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        playerCount: s._count.snapshots,
      })),
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
