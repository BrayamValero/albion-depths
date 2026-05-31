import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.weaponStats.deleteMany()
      await tx.seasonSnapshot.deleteMany()
      await tx.killEquipment.deleteMany()
      await tx.killInventory.deleteMany()
      await tx.eventParticipant.deleteMany()
      await tx.headToHead.deleteMany()
      await tx.kill.deleteMany()
      await tx.syncLog.deleteMany()
      await tx.syncState.deleteMany()
      await tx.player.deleteMany()
      await tx.season.deleteMany()

      await tx.season.create({
        data: {
          number: 1,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      })
    })

    return NextResponse.json({ success: true, message: 'All data wiped. Reset to Season 1.' })
  } catch (error) {
    console.error('Reset all error:', error)
    return NextResponse.json({ error: 'Failed to reset all data' }, { status: 500 })
  }
}
