import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'
import { getPrices, calcValue, allEquipItems } from '@/lib/pricing'

const EQUIP_SLOTS = ['MainHand', 'OffHand', 'Head', 'Armor', 'Shoes', 'Bag', 'Cape', 'Mount', 'Potion', 'Food'] as const

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
        equipment: true,
        inventory: true,
      },
    })

    if (!kill) {
      return NextResponse.json({ error: 'Kill not found' }, { status: 404 })
    }

    const equipByOwner = new Map<string, Record<string, { Type: string; Count: number; Quality: number } | null>>()
    for (const eq of kill.equipment) {
      if (!equipByOwner.has(eq.owner)) {
        equipByOwner.set(eq.owner, {})
      }
      equipByOwner.get(eq.owner)![eq.slot] = { Type: eq.itemType, Count: eq.count, Quality: eq.quality }
    }

    const buildEquipment = (ownerId: string) => equipByOwner.get(ownerId) ?? {}
    const killerEquip = buildEquipment(kill.killerId)
    const victimEquip = buildEquipment(kill.victimId)

    const victimInventory = kill.inventory.map((i) => ({
      Type: i.itemType,
      Count: i.count,
      Quality: i.quality,
    }))

    const allEquipItems_ = (equip: Record<string, any>) =>
      EQUIP_SLOTS.map((s) => equip[s]).filter(Boolean) as { Type: string; Quality?: number }[]

    const priceItems = [
      ...victimInventory.map((i: any) => ({ Type: i.Type, Quality: i.Quality })),
      ...allEquipItems_(killerEquip),
      ...allEquipItems_(victimEquip),
    ]
    const priceMap = await getPrices(priceItems)

    const lootSilverValue = (() => {
      const v = Math.round(calcValue(victimInventory, priceMap))
      return v > 0 ? v : null
    })()
    const killerGearValue = Math.round(calcValue(allEquipItems_(killerEquip).map((e) => ({ ...e, Count: 1 })), priceMap))
    const victimGearValue = Math.round(calcValue(allEquipItems_(victimEquip).map((e) => ({ ...e, Count: 1 })), priceMap))

    const groupMemberIds: string[] = kill.groupMembers ? JSON.parse(kill.groupMembers) : []

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
      participants: kill.participants.map((p) => ({
        id: p.player.id,
        name: p.player.name,
        mmr: p.player.mmr,
        tier: getTier(p.player.mmr),
        role: p.role,
        mmrChange: p.mmrChange,
        damageDone: p.damageDone,
        healingDone: p.healingDone,
        ip: Math.round(p.ip ?? 0),
        equipment: buildEquipment(p.player.id),
      })),
      groupMemberCount: kill.groupMemberCount,
      killerPartyMmr: kill.killerPartyMmr,
      killerPartySize: kill.killerPartySize,
      killerPartyMembers: groupMemberIds.length > 1
        ? groupMemberIds.map((id) => {
            const member = kill.participants.find((p) => p.player.id === id)
            return {
              id,
              name: member?.player.name ?? 'Unknown',
              mmr: member?.player.mmr ?? 0,
              tier: member ? getTier(member.player.mmr) : 'Iron',
            }
          })
        : [],
      location: kill.location,
      killArea: kill.killArea,
      battleId: kill.battleId,
    })
  } catch (error) {
    console.error('Error fetching kill:', error)
    return NextResponse.json({ error: 'Failed to fetch kill' }, { status: 500 })
  }
}
