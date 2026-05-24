import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'

const EQUIP_SLOTS = ['MainHand', 'OffHand', 'Head', 'Armor', 'Shoes', 'Bag', 'Cape', 'Mount', 'Potion', 'Food'] as const

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

    const killInventories = kills.map((kill) => {
      let items: { Type: string; Count: number; Quality: number }[] = []
      if (kill.rawData) {
        try {
          const raw = JSON.parse(kill.rawData)
          const inv = raw.Victim?.Inventory
          if (inv) {
            items = inv.filter((i: any) => i?.Type).map((i: any) => ({
              Type: i.Type,
              Count: i.Count ?? 1,
              Quality: i.Quality ?? 0,
            }))
          }
        } catch {}
      }
      return items
    })

    let priceMap = new Map<string, Map<number, number>>()
    try {
      const allTypes = Array.from(new Set(killInventories.flat().map((i) => i.Type)))
      if (allTypes.length > 0) {
        const res = await fetch(
          `https://www.albion-online-data.com/api/v2/stats/prices/${allTypes.join(',')}?qualities=1,2,3,4,5`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (res.ok) {
          const data: any[] = await res.json()
          for (const entry of data) {
            const id = entry.item_id
            const q = entry.quality ?? 1
            const price = Math.max(entry.sell_price_min ?? 0, 0)
            if (price <= 0) continue
            if (!priceMap.has(id)) priceMap.set(id, new Map())
            const prev = priceMap.get(id)!.get(q) ?? 0
            if (price > prev) priceMap.get(id)!.set(q, price)
          }
        }
      }
    } catch { /* price fetch failed */ }

    const data = kills.map((kill, idx) => {
      const invItems = killInventories[idx]
      const lootSilverValue = invItems.reduce((sum, item) => {
        const byQ = priceMap.get(item.Type)
        if (!byQ) return sum
        return sum + (byQ.get(item.Quality) ?? 0) * item.Count
      }, 0)

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
        lootSilverValue: lootSilverValue > 0 ? Math.round(lootSilverValue) : null,
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
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
