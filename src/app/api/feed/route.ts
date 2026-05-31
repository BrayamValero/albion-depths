import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'

const EQUIP_SLOTS = ['MainHand', 'OffHand', 'Head', 'Armor', 'Shoes', 'Bag', 'Cape', 'Mount', 'Potion', 'Food'] as const

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0)

    const [total, kills] = await Promise.all([
      prisma.kill.count(),
      prisma.kill.findMany({
        orderBy: { killTime: 'desc' },
        skip,
        take: limit,
        include: {
          killer: {
            select: { id: true, name: true, mmr: true },
          },
          victim: {
            select: { id: true, name: true, mmr: true },
          },
          inventory: true,
          equipment: true,
        },
      }),
    ])

    const buildEquipment = (ownerId: string, allEquip: typeof kills[0]['equipment']) => {
      const equip: Record<string, { Type: string; Count: number; Quality: number } | null> = {}
      for (const eq of allEquip) {
        if (eq.owner === ownerId) {
          equip[eq.slot] = { Type: eq.itemType, Count: eq.count, Quality: eq.quality }
        }
      }
      return equip
    }

    const data = kills.map((kill) => {
      const invItems = kill.inventory.map((i) => ({ Type: i.itemType, Count: i.count, Quality: i.quality }))

      return {
        id: kill.id,
        eventId: kill.eventId,
        role: 'KILL' as const,
        killer: {
          id: kill.killer.id,
          name: kill.killer.name,
          mmr: kill.killer.mmr,
          tier: getTier(kill.killer.mmr),
        },
        victim: {
          id: kill.victim.id,
          name: kill.victim.name,
          mmr: kill.victim.mmr,
          tier: getTier(kill.victim.mmr),
        },
        mmrChange: kill.mmrChange,
        killTime: kill.killTime,
        fame: kill.fame,
        totalFame: kill.totalFame,
        lootSilverValue: kill.lootSilverValue,
        lootCount: invItems.reduce((s, i) => s + i.Count, 0),
        killerWeapon: kill.killerWeapon,
        victimWeapon: kill.victimWeapon,
        killerGuild: kill.killerGuild,
        victimGuild: kill.victimGuild,
        killerAlliance: kill.killerAlliance,
        victimAlliance: kill.victimAlliance,
        killerIp: Math.round(kill.killerIp ?? 0),
        victimIp: Math.round(kill.victimIp ?? 0),
        groupMemberCount: kill.groupMemberCount,
        killerEquipment: buildEquipment(kill.killerId, kill.equipment),
        victimEquipment: buildEquipment(kill.victimId, kill.equipment),
      }
    })

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
