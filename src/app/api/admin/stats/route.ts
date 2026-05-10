import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [totalPlayers, totalKills, lastSync] = await Promise.all([
      prisma.player.count(),
      prisma.kill.count(),
      prisma.syncLog.findFirst({
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      totalPlayers,
      totalKills,
      lastSyncAt: lastSync?.createdAt || null,
      lastSyncStatus: lastSync?.status || null,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}