import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'
import type { Tier } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const tier = searchParams.get('tier') as Tier | null

    const where = tier
      ? {
          mmr: {
            gte: tier === 'Bronze' ? 900 : tier === 'Silver' ? 1200 : tier === 'Gold' ? 1500 : tier === 'Crystal' ? 2000 : 0,
            lt: tier === 'Iron' ? 900 : tier === 'Bronze' ? 1200 : tier === 'Silver' ? 1500 : tier === 'Gold' ? 2000 : 99999,
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
      kd: player.deaths > 0 ? Number((player.kills / player.deaths).toFixed(2)) : player.kills,
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