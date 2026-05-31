import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [asKiller, asVictim, assistEvents] = await Promise.all([
      prisma.headToHead.findMany({
        where: { killerId: id },
        include: { victim: { select: { id: true, name: true } } },
      }),
      prisma.headToHead.findMany({
        where: { victimId: id },
        include: { killer: { select: { id: true, name: true } } },
      }),
      prisma.eventParticipant.findMany({
        where: { playerId: id, role: 'ASSISTER' },
        select: {
          kill: { select: { victimId: true, victim: { select: { id: true, name: true } } } },
        },
      }),
    ])

    const rivals = new Map<string, { opponentId: string; opponentName: string; killedByMe: number; killedMe: number }>()

    for (const h2h of asKiller) {
      rivals.set(h2h.victimId, {
        opponentId: h2h.victimId,
        opponentName: h2h.victim.name,
        killedByMe: h2h.killCount,
        killedMe: 0,
      })
    }

    for (const h2h of asVictim) {
      const existing = rivals.get(h2h.killerId)
      if (existing) {
        existing.killedMe = h2h.killCount
      } else {
        rivals.set(h2h.killerId, {
          opponentId: h2h.killerId,
          opponentName: h2h.killer.name,
          killedByMe: 0,
          killedMe: h2h.killCount,
        })
      }
    }

    for (const ep of assistEvents) {
      const victimId = ep.kill.victimId
      const existing = rivals.get(victimId)
      if (existing) {
        existing.killedByMe += 1
      } else {
        rivals.set(victimId, {
          opponentId: victimId,
          opponentName: ep.kill.victim.name,
          killedByMe: 1,
          killedMe: 0,
        })
      }
    }

    let data = Array.from(rivals.values()).sort((a, b) => b.killedMe - a.killedMe)

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    if (limit > 0) data = data.slice(0, limit)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching rivals:', error)
    return NextResponse.json({ error: 'Failed to fetch rivals' }, { status: 500 })
  }
}
