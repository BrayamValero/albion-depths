import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const lastSeason = await prisma.season.findFirst({
      orderBy: { number: 'desc' },
    })
    const nextNumber = (lastSeason?.number ?? 0) + 1

    // Deactivate any active seasons
    await prisma.season.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Create new 60-day season
    await prisma.season.create({
      data: {
        number: nextNumber,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    })

    // Reset player MMR
    await prisma.player.updateMany({
      data: {
        mmr: 1000,
        streak: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        lastKillAt: null,
      },
    })

    // Clear kill data
    await prisma.eventParticipant.deleteMany()
    await prisma.headToHead.deleteMany()
    await prisma.kill.deleteMany()
    await prisma.syncState.deleteMany()
    await prisma.syncLog.deleteMany()

    return NextResponse.json({ success: true, message: `Season ${nextNumber} started. All MMR reset to 1000. Season ends in 60 days.` })
  } catch (error) {
    console.error('Reset season error:', error)
    return NextResponse.json({ error: 'Failed to reset season' }, { status: 500 })
  }
}