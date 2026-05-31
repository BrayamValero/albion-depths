import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { playerId } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 })
    }

    const kills = await prisma.kill.findMany({
      where: {
        killerId: playerId,
        groupMemberCount: { gte: 2 },
        groupMembers: { not: null },
      },
      orderBy: { killTime: 'desc' },
      take: 50,
      select: {
        groupMembers: true,
      },
    })

    const memberIds = new Set<string>()
    for (const kill of kills) {
      if (!kill.groupMembers) continue
      const ids: string[] = JSON.parse(kill.groupMembers)
      for (const id of ids) memberIds.add(id)
    }

    const players = await prisma.player.findMany({
      where: { id: { in: Array.from(memberIds) } },
      select: { id: true, name: true },
    })
    const nameMap = new Map(players.map((p) => [p.id, p.name]))

    const seen = new Set<string>()
    const groups: string[][] = []

    for (const kill of kills) {
      if (!kill.groupMembers) continue
      const ids: string[] = JSON.parse(kill.groupMembers)
      if (ids.length < 2 || ids.length > 3) continue
      const names = ids.map((id) => nameMap.get(id)).filter((n): n is string => !!n)
      if (names.length < 2) continue
      const key = [...names].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      groups.push(names)
    }

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Calculator API error:', error)
    return NextResponse.json({ error: 'Failed to fetch player data' }, { status: 500 })
  }
}
