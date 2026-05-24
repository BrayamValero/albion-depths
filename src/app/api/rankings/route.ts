import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier, TIER_THRESHOLDS } from '@/lib/mmr'
import type { Tier } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const tier = searchParams.get('tier') as Tier | null

    const tierBounds: Record<string, { gte: number; lt: number }> = {}
    for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
      const t = TIER_THRESHOLDS[i]
      const nextTier = TIER_THRESHOLDS[i - 1]
      tierBounds[t.tier] = { gte: t.minMMR, lt: nextTier?.minMMR ?? 99999 }
    }

    const where = tier
      ? {
          mmr: {
            gte: tierBounds[tier]?.gte ?? 0,
            lt: tierBounds[tier]?.lt ?? 99999,
          },
        }
      : {}

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        orderBy: { mmr: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.player.count({ where }),
    ])

    const data = players.map((player, index) => ({
      id: player.id,
      name: player.name,
      mmr: player.mmr,
      tier: getTier(player.mmr),
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      kd: player.deaths > 0 ? Number(((player.kills + player.assists) / player.deaths).toFixed(2)) : (player.kills + player.assists),
      streak: player.streak,
      rank: (page - 1) * limit + index + 1,
    }))

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching rankings:', error)
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 })
  }
}