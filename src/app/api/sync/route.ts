import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchKillEvents, isDepthsKill, isValidKillEvent } from '@/lib/albion-api'
import { calculateMMRChange, STARTING_MMR } from '@/lib/mmr'

export async function POST() {
  try {
    const events = await fetchKillEvents(50, 0)

    const depthsEvents = events.filter(
      (event) => isDepthsKill(event) && isValidKillEvent(event)
    )

    let syncedCount = 0

    for (const event of depthsEvents) {
      const existingKill = await prisma.kill.findUnique({
        where: { eventId: String(event.EventId) },
      })

      if (existingKill) continue

      let killer = await prisma.player.findUnique({
        where: { id: event.Killer.Id },
      })

      if (!killer) {
        killer = await prisma.player.create({
          data: {
            id: event.Killer.Id,
            name: event.Killer.Name,
            mmr: STARTING_MMR,
          },
        })
      }

      let victim = await prisma.player.findUnique({
        where: { id: event.Victim.Id },
      })

      if (!victim) {
        victim = await prisma.player.create({
          data: {
            id: event.Victim.Id,
            name: event.Victim.Name,
            mmr: STARTING_MMR,
          },
        })
      }

      const killerMMR = killer.mmr
      const victimMMR = victim.mmr
      const opponentAvgMMR = (killerMMR + victimMMR) / 2

      const killerMMRChange = calculateMMRChange(killerMMR, opponentAvgMMR, true, killer.streak)
      const victimMMRChange = calculateMMRChange(victimMMR, opponentAvgMMR, false, victim.streak)

      await prisma.$transaction([
        prisma.player.update({
          where: { id: killer.id },
          data: {
            mmr: { increment: killerMMRChange },
            kills: { increment: 1 },
            streak: { increment: 1 },
            lastKillAt: new Date(),
          },
        }),
        prisma.player.update({
          where: { id: victim.id },
          data: {
            mmr: { increment: victimMMRChange },
            deaths: { increment: 1 },
            streak: 0,
          },
        }),
        prisma.kill.create({
          data: {
            eventId: String(event.EventId),
            killerId: killer.id,
            victimId: victim.id,
            mmrChange: killerMMRChange,
            killTime: new Date(event.TimeStamp),
            fame: event.Killer.KillFame,
          },
        }),
        prisma.headToHead.upsert({
          where: { killerId_victimId: { killerId: killer.id, victimId: victim.id } },
          update: {
            killCount: { increment: 1 },
            lastKillAt: new Date(),
          },
          create: {
            killerId: killer.id,
            victimId: victim.id,
            killCount: 1,
            lastKillAt: new Date(),
          },
        }),
      ])

      syncedCount++
    }

    await prisma.syncLog.create({
      data: {
        status: 'success',
        message: `Synced ${syncedCount} new kills`,
        killsSynced: syncedCount,
      },
    })

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      totalProcessed: depthsEvents.length,
    })
  } catch (error) {
    console.error('Sync error:', error)

    await prisma.syncLog.create({
      data: {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        killsSynced: 0,
      },
    })

    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}