import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const kills = await prisma.kill.findMany({
      orderBy: { killTime: 'desc' },
      take: limit,
      include: {
        killer: {
          select: { id: true, name: true, mmr: true },
        },
        victim: {
          select: { id: true, name: true, mmr: true },
        },
      },
    })

    const data = kills.map((kill) => ({
      id: kill.id,
      eventId: kill.eventId,
      killer: {
        id: kill.killer.id,
        name: kill.killer.name,
        mmr: kill.killer.mmr,
      },
      victim: {
        id: kill.victim.id,
        name: kill.victim.name,
        mmr: kill.victim.mmr,
      },
      mmrChange: kill.mmrChange,
      killTime: kill.killTime,
      fame: kill.fame,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}