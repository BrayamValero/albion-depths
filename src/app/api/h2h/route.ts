import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const playerA = searchParams.get('playerA')
    const playerB = searchParams.get('playerB')

    if (!playerA || !playerB) {
      return NextResponse.json({ error: 'Missing playerA or playerB parameter' }, { status: 400 })
    }

    const [playerAData, playerBData, h2hAB, h2hBA] = await Promise.all([
      prisma.player.findUnique({ where: { id: playerA }, select: { id: true, name: true } }),
      prisma.player.findUnique({ where: { id: playerB }, select: { id: true, name: true } }),
      prisma.headToHead.findUnique({
        where: { killerId_victimId: { killerId: playerA, victimId: playerB } },
      }),
      prisma.headToHead.findUnique({
        where: { killerId_victimId: { killerId: playerB, victimId: playerA } },
      }),
    ])

    if (!playerAData || !playerBData) {
      return NextResponse.json({ error: 'One or both players not found' }, { status: 404 })
    }

    return NextResponse.json({
      playerA: playerAData.name,
      playerB: playerBData.name,
      playerAId: playerAData.id,
      playerBId: playerBData.id,
      playerAKills: h2hAB?.killCount || 0,
      playerBKills: h2hBA?.killCount || 0,
      lastInteraction: h2hAB?.lastKillAt || h2hBA?.lastKillAt || null,
    })
  } catch (error) {
    console.error('Error fetching head-to-head:', error)
    return NextResponse.json({ error: 'Failed to fetch head-to-head' }, { status: 500 })
  }
}