import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'

export async function POST() {
  try {
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
    })

    if (!activeSeason) {
      return NextResponse.json({ error: 'No active season found' }, { status: 400 })
    }

    // Check if this season already has snapshots (already ended)
    const existingCount = await prisma.seasonSnapshot.count({
      where: { seasonId: activeSeason.id },
    })
    if (existingCount > 0) {
      return NextResponse.json({ error: 'This season has already been ended' }, { status: 400 })
    }

    const nextNumber = activeSeason.number + 1

    // Fetch all players ordered by MMR desc with their rank
    const allPlayers = await prisma.player.findMany({
      orderBy: { mmr: 'desc' },
      select: {
        id: true,
        name: true,
        mmr: true,
        kills: true,
        deaths: true,
        assists: true,
      },
    })

    await prisma.$transaction(async (tx) => {
      // 1. Create snapshot for each player
      for (let i = 0; i < allPlayers.length; i++) {
        const p = allPlayers[i]
        await tx.seasonSnapshot.create({
          data: {
            seasonId: activeSeason.id,
            seasonNumber: activeSeason.number,
            playerId: p.id,
            playerName: p.name,
            mmr: p.mmr,
            tier: getTier(p.mmr),
            rank: i + 1,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
          },
        })
      }

      // 2. Close current season
      await tx.season.update({
        where: { id: activeSeason.id },
        data: { isActive: false, endsAt: new Date() },
      })

      // 3. Create new season
      await tx.season.create({
        data: {
          number: nextNumber,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      })

      // 4. Reset all players
      await tx.player.updateMany({
        data: {
          mmr: 1000,
          streak: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          lastKillAt: null,
        },
      })

      // 5. Clear HeadToHead (kill counts are meaningless across seasons)
      await tx.headToHead.deleteMany()
    })

    return NextResponse.json({
      success: true,
      message: `Season ${activeSeason.number} ended with ${allPlayers.length} players snapshotted. Season ${nextNumber} started.`,
      playersSnapshotted: allPlayers.length,
      previousSeason: activeSeason.number,
      newSeason: nextNumber,
    })
  } catch (error) {
    console.error('End season error:', error)
    return NextResponse.json({ error: 'Failed to end season' }, { status: 500 })
  }
}
