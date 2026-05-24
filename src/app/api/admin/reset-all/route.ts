import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    await prisma.$transaction([
      prisma.eventParticipant.deleteMany(),
      prisma.headToHead.deleteMany(),
      prisma.kill.deleteMany(),
      prisma.syncLog.deleteMany(),
      prisma.syncState.deleteMany(),
      prisma.player.deleteMany(),
    ])

    return NextResponse.json({ success: true, message: 'All data has been wiped' })
  } catch (error) {
    console.error('Reset all error:', error)
    return NextResponse.json({ error: 'Failed to reset all data' }, { status: 500 })
  }
}
