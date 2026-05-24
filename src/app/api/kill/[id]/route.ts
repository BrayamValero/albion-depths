import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const kill = await prisma.kill.findUnique({
      where: { id: parseInt(id) },
      include: {
        killer: { select: { id: true, name: true, mmr: true } },
        victim: { select: { id: true, name: true, mmr: true } },
        participants: {
          include: {
            player: { select: { id: true, name: true, mmr: true } },
          },
        },
      },
    })

    if (!kill) {
      return NextResponse.json({ error: 'Kill not found' }, { status: 404 })
    }

    const raw = JSON.parse(kill.rawData || '{}')

    const EQUIP_SLOTS = ['MainHand', 'OffHand', 'Head', 'Armor', 'Shoes', 'Bag', 'Cape', 'Mount', 'Potion', 'Food'] as const

    const parseEquipment = (playerData: any) => {
      if (!playerData?.Equipment) return {}
      const equip: Record<string, { Type?: string; Count?: number; Quality?: number } | null> = {}
      for (const slot of EQUIP_SLOTS) {
        if (playerData.Equipment[slot]?.Type) {
          equip[slot] = {
            Type: playerData.Equipment[slot].Type,
            Count: playerData.Equipment[slot].Count,
            Quality: playerData.Equipment[slot].Quality,
          }
        }
      }
      return equip
    }

    const parseInventory = (playerData: any) => {
      if (!playerData?.Inventory) return []
      return playerData.Inventory
        .filter((item: any) => item?.Type)
        .map((item: any) => ({
          Type: item.Type,
          Count: item.Count ?? 1,
          Quality: item.Quality ?? 0,
        }))
    }

    const killerEquip = parseEquipment(raw.Killer)
    const victimEquip = parseEquipment(raw.Victim)
    const victimInventory = parseInventory(raw.Victim)

    const rawParticipants = (raw.Participants ?? []) as any[]
    const rawParticipantMap = new Map<string, any>()
    for (const rp of rawParticipants) {
      if (rp?.Id) rawParticipantMap.set(rp.Id, rp)
    }

    const allEquipItems = (equip: Record<string, any>) =>
      EQUIP_SLOTS.map((s) => equip[s]).filter(Boolean) as { Type: string; Quality?: number }[]

    const fetchPrices = async (items: { Type: string; Quality?: number }[]): Promise<Map<string, Map<number, number>>> => {
      const map = new Map<string, Map<number, number>>()
      const types = Array.from(new Set(items.map((i) => i.Type).filter(Boolean)))
      if (types.length === 0) return map
      try {
        const res = await fetch(
          `https://www.albion-online-data.com/api/v2/stats/prices/${types.join(',')}?qualities=1,2,3,4,5`,
          { signal: AbortSignal.timeout(5000) }
        )
        if (res.ok) {
          const data: any[] = await res.json()
          for (const entry of data) {
            const id = entry.item_id
            const q = entry.quality ?? 1
            const price = Math.max(entry.sell_price_min ?? 0, 0)
            if (price <= 0) continue
            if (!map.has(id)) map.set(id, new Map())
            const prev = map.get(id)!.get(q) ?? 0
            if (price > prev) map.get(id)!.set(q, price)
          }
        }
      } catch { /* ignore */ }
      return map
    }

    const calcValue = (items: { Type: string; Count?: number; Quality?: number }[], pm: Map<string, Map<number, number>>) =>
      items.reduce((total, item) => {
        const byQ = pm.get(item.Type)
        if (!byQ) return total
        const price = byQ.get(item.Quality ?? 1) ?? 0
        return total + price * (item.Count ?? 1)
      }, 0)

    const priceItems = [
      ...victimInventory.map((i: any) => ({ Type: i.Type, Quality: i.Quality })),
      ...allEquipItems(killerEquip),
      ...allEquipItems(victimEquip),
    ]
    const priceMap = await fetchPrices(priceItems)

    const lootSilverValue = (() => {
      const v = Math.round(calcValue(victimInventory, priceMap))
      return v > 0 ? v : null
    })()
    const killerGearValue = Math.round(calcValue(allEquipItems(killerEquip).map((e) => ({ ...e, Count: 1 })), priceMap))
    const victimGearValue = Math.round(calcValue(allEquipItems(victimEquip).map((e) => ({ ...e, Count: 1 })), priceMap))

    return NextResponse.json({
      id: kill.id,
      eventId: kill.eventId,
      killTime: kill.killTime,
      fame: kill.fame,
      totalFame: kill.totalFame,
      mmrChange: kill.mmrChange,
      killer: {
        id: kill.killer.id,
        name: kill.killer.name,
        mmr: kill.killer.mmr,
        tier: getTier(kill.killer.mmr),
        guild: kill.killerGuild,
        alliance: kill.killerAlliance,
        ip: Math.round(kill.killerIp ?? 0),
      },
      victim: {
        id: kill.victim.id,
        name: kill.victim.name,
        mmr: kill.victim.mmr,
        tier: getTier(kill.victim.mmr),
        guild: kill.victimGuild,
        alliance: kill.victimAlliance,
        ip: Math.round(kill.victimIp ?? 0),
      },
      killerWeapon: kill.killerWeapon,
      victimWeapon: kill.victimWeapon,
      killerEquipment: killerEquip,
      killerGearValue,
      victimEquipment: victimEquip,
      victimGearValue,
      victimInventory,
      lootTotalCount: victimInventory.reduce((sum: number, item: { Count?: number }) => sum + (item.Count ?? 1), 0),
      lootSilverValue,
      participants: kill.participants.map((p) => {
        const rawP = rawParticipantMap.get(p.player.id)
        return {
          id: p.player.id,
          name: p.player.name,
          mmr: p.player.mmr,
          tier: getTier(p.player.mmr),
          role: p.role,
          mmrChange: p.mmrChange,
          damageDone: p.damageDone,
          healingDone: p.healingDone,
          ip: rawP ? Math.round(rawP.AverageItemPower ?? 0) : 0,
          equipment: rawP ? parseEquipment(rawP) : {},
        }
      }),
      groupMemberCount: kill.groupMemberCount,
      killerPartyMmr: kill.killerPartyMmr,
      killerPartySize: kill.killerPartySize,
      killerPartyMembers: (() => {
        const gms = raw.GroupMembers as { Id: string; Name: string }[] | undefined
        if (!gms || gms.length <= 1) return []
        return gms.map((gm) => {
          const member = kill.participants.find((p) => p.player.id === gm.Id)
          return {
            id: gm.Id,
            name: gm.Name,
            mmr: member?.player.mmr ?? 0,
            tier: member ? getTier(member.player.mmr) : 'Iron',
          }
        })
      })(),
      location: kill.location,
      killArea: kill.killArea,
      battleId: kill.battleId,
    })
  } catch (error) {
    console.error('Error fetching kill:', error)
    return NextResponse.json({ error: 'Failed to fetch kill' }, { status: 500 })
  }
}
