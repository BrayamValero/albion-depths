import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    await prisma.player.updateMany({
      data: {
        mmr: 1000,
        streak: 0,
      },
    })

    return NextResponse.json({ success: true, message: 'Season reset complete' })
  } catch (error) {
    console.error('Reset season error:', error)
    return NextResponse.json({ error: 'Failed to reset season' }, { status: 500 })
  }
}