import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const playerA = searchParams.get('playerA')
    const playerB = searchParams.get('playerB')

    if (!playerA || !playerB) {
      return NextResponse.json({ error: 'Missing playerA or playerB parameter' }, { status: 400 })
    }

    const [playerAData, playerBData, h2hAB, h2hBA, assistsAB, assistsBA] = await Promise.all([
      prisma.player.findUnique({ where: { id: playerA } }),
      prisma.player.findUnique({ where: { id: playerB } }),
      prisma.headToHead.findUnique({
        where: { killerId_victimId: { killerId: playerA, victimId: playerB } },
      }),
      prisma.headToHead.findUnique({
        where: { killerId_victimId: { killerId: playerB, victimId: playerA } },
      }),
      prisma.eventParticipant.count({
        where: { playerId: playerA, role: 'ASSISTER', kill: { victimId: playerB } },
      }),
      prisma.eventParticipant.count({
        where: { playerId: playerB, role: 'ASSISTER', kill: { victimId: playerA } },
      }),
    ])

    if (!playerAData || !playerBData) {
      return NextResponse.json({ error: 'One or both players not found' }, { status: 404 })
    }

    const pAKills = (h2hAB?.killCount || 0) + assistsAB
    const pBKills = (h2hBA?.killCount || 0) + assistsBA

    return NextResponse.json({
      playerA: playerAData.name,
      playerB: playerBData.name,
      playerAId: playerAData.id,
      playerBId: playerBData.id,
      playerAMmr: playerAData.mmr,
      playerBMmr: playerBData.mmr,
      playerATier: getTier(playerAData.mmr),
      playerBTier: getTier(playerBData.mmr),
      playerAKills: pAKills,
      playerBKills: pBKills,
      playerADeaths: h2hBA?.killCount || 0,
      playerBDeaths: h2hAB?.killCount || 0,
      lastInteraction: h2hAB?.lastKillAt || h2hBA?.lastKillAt || null,
    })
  } catch (error) {
    console.error('Error fetching head-to-head:', error)
    return NextResponse.json({ error: 'Failed to fetch head-to-head' }, { status: 500 })
  }
}