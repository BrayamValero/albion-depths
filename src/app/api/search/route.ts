import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ data: [] })
    }

    const players = await prisma.player.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      orderBy: { mmr: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        mmr: true,
      },
    })

    const data = players.map((player) => ({
      id: player.id,
      name: player.name,
      mmr: player.mmr,
      tier: getTier(player.mmr),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error searching players:', error)
    return NextResponse.json({ error: 'Failed to search players' }, { status: 500 })
  }
}