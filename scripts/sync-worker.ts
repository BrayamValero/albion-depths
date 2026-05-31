import { PrismaClient, Prisma } from '@prisma/client'
import {
  fetchAllRecentEvents,
  isDepthsKill,
  isValidKillEvent,
  extractWeaponType,
} from '../src/lib/albion-api'
import { calculateMMRChange, calculatePartyAvgMMR, STARTING_MMR } from '../src/lib/mmr'
import { extractWeaponFamily, extractWeaponKey } from '../src/lib/weapons'
import { getPrices, calcValue } from '../src/lib/pricing'
import { AlbionKillEvent } from '../src/lib/types'

const prisma = new PrismaClient()
const POLL_INTERVAL_MS = 15_000

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

async function ensurePlayer(id: string, name: string) {
  let player = await prisma.player.findUnique({ where: { id } })
  if (player) return player
  try {
    player = await prisma.player.create({ data: { id, name, mmr: STARTING_MMR } })
  } catch {
    player = await prisma.player.findUnique({ where: { id } })
  }
  return player!
}

async function processEvent(event: AlbionKillEvent, priceMap?: Map<string, Map<number, number>>): Promise<boolean> {
  const existingKill = await prisma.kill.findUnique({
    where: { eventId: String(event.EventId) },
  })
  if (existingKill) return false

  const killerData = event.Killer
  const victimData = event.Victim

  const killer = await ensurePlayer(killerData.Id, killerData.Name)
  const victim = await ensurePlayer(victimData.Id, victimData.Name)

  // Compute killer's party average MMR if they have group members
  const groupMembers = (event.GroupMembers ?? []) as { Id: string; Name: string }[]
  let effectiveKillerMMR = killer.mmr
  let killerPartyMmr: number | null = null
  let killerPartySize: number | null = null
  if (groupMembers.length > 1) {
    const partyMembers = await Promise.all(
      groupMembers.map(async (gm) => {
        const p = await ensurePlayer(gm.Id, gm.Name)
        return p.mmr
      })
    )
    killerPartySize = groupMembers.length
    killerPartyMmr = calculatePartyAvgMMR(partyMembers.map((mmr) => ({ mmr })))
    effectiveKillerMMR = killerPartyMmr
  }

  const avgMMR = Math.round((effectiveKillerMMR + victim.mmr) / 2)
  const killerMMRChange = calculateMMRChange(effectiveKillerMMR, avgMMR, true, killer.streak)
  const victimMMRChange = calculateMMRChange(victim.mmr, avgMMR, false, victim.streak)

  const participants = event.Participants ?? []
  const seenIds = new Set<string>([killerData.Id, victimData.Id])
  const assisters: { player: Awaited<ReturnType<typeof ensurePlayer>>; mmrChange: number; damage: number; healing: number; equipment: any }[] = []
  let killerDamage = 0
  let killerHealing = 0
  let victimDamage = 0
  let victimHealing = 0

  // Collect equipment data from all participants (including the assisters we'll process)
  const participantEquipmentMap = new Map<string, any>()
  if (killerData.Equipment) participantEquipmentMap.set(killerData.Id, killerData.Equipment)
  if (victimData.Equipment) participantEquipmentMap.set(victimData.Id, victimData.Equipment)

  for (const p of participants) {
    if (p.Id === killerData.Id) {
      killerDamage = p.DamageDone ?? 0
      killerHealing = p.SupportHealingDone ?? 0
    }
    if (p.Id === victimData.Id) {
      victimDamage = p.DamageDone ?? 0
      victimHealing = p.SupportHealingDone ?? 0
    }
    if (p.Equipment) participantEquipmentMap.set(p.Id, p.Equipment)
    if (seenIds.has(p.Id)) continue
    seenIds.add(p.Id)

    const assister = await ensurePlayer(p.Id, p.Name)
    const assisterAvg = Math.round((assister.mmr + victim.mmr) / 2)
    const mmrChange = calculateMMRChange(assister.mmr, assisterAvg, true, 0)
    assisters.push({ player: assister, mmrChange, damage: p.DamageDone ?? 0, healing: p.SupportHealingDone ?? 0, equipment: p.Equipment })
  }

  await prisma.$transaction(async (tx) => {
    await tx.player.update({
      where: { id: killer.id },
      data: {
        mmr: { increment: killerMMRChange },
        kills: { increment: 1 },
        streak: { increment: 1 },
        lastKillAt: new Date(),
      },
    })

    await tx.player.update({
      where: { id: victim.id },
      data: {
        mmr: { increment: victimMMRChange },
        deaths: { increment: 1 },
        streak: 0,
      },
    })

      const lootValue = priceMap && victimData.Inventory
        ? Math.round(calcValue(
            victimData.Inventory
              .filter((i: any) => i?.Type)
              .map((i: any) => ({ Type: i.Type, Count: i.Count ?? 1, Quality: i.Quality ?? 1 })),
            priceMap,
          ))
        : null

      const kill = await tx.kill.create({
        data: {
          eventId: String(event.EventId),
          killerId: killer.id,
          victimId: victim.id,
          mmrChange: killerMMRChange,
          killTime: new Date(event.TimeStamp),
          fame: killerData.KillFame,
          lootSilverValue: lootValue && lootValue > 0 ? lootValue : null,
        killerWeapon: extractWeaponType(killerData.Equipment),
        victimWeapon: extractWeaponType(victimData.Equipment),
        killerGuild: killerData.GuildName ?? null,
        victimGuild: victimData.GuildName ?? null,
        killerAlliance: killerData.AllianceName ?? null,
        victimAlliance: victimData.AllianceName ?? null,
        killerIp: killerData.AverageItemPower ?? null,
        victimIp: victimData.AverageItemPower ?? null,
        totalFame: event.TotalVictimKillFame ?? null,
        killArea: event.KillArea ?? null,
        groupMemberCount: event.groupMemberCount ?? null,
        killerPartyMmr,
        killerPartySize,
        groupMembers: groupMembers.length > 0 ? JSON.stringify(groupMembers.map(gm => gm.Id)) : null,
        battleId: event.BattleId != null ? String(event.BattleId) : null,
        location: event.Location ?? null,
      },
    })

    const EQUIP_SLOTS = ['MainHand', 'OffHand', 'Head', 'Armor', 'Shoes', 'Bag', 'Cape', 'Mount', 'Potion', 'Food'] as const

    const equipRows: { killId: number; owner: string; slot: string; itemType: string; quality: number; count: number }[] = []
    const invRows: { killId: number; itemType: string; quality: number; count: number }[] = []

    const collectEquipment = (owner: string, equip: any) => {
      if (!equip) return
      for (const slot of EQUIP_SLOTS) {
        const item = equip[slot]
        if (item?.Type) {
          equipRows.push({ killId: kill.id, owner, slot, itemType: item.Type, quality: item.Quality ?? 1, count: item.Count ?? 1 })
        }
      }
    }

    const collectInventory = (inv: any[] | null | undefined) => {
      if (!inv) return
      for (const item of inv) {
        if (item?.Type) {
          invRows.push({ killId: kill.id, itemType: item.Type, quality: item.Quality ?? 1, count: item.Count ?? 1 })
        }
      }
    }

    collectEquipment(killer.id, killerData.Equipment)
    collectEquipment(victim.id, victimData.Equipment)
    collectInventory(victimData.Inventory)

    for (const a of assisters) {
      const equip = participantEquipmentMap.get(a.player.id)
      if (equip) collectEquipment(a.player.id, equip)
    }

    if (equipRows.length > 0) await tx.killEquipment.createMany({ data: equipRows })
    if (invRows.length > 0) await tx.killInventory.createMany({ data: invRows })

    const getParticipantIp = (playerId: string): number | null => {
      const p = participants.find((p) => p.Id === playerId)
      return p ? Math.round(p.AverageItemPower ?? 0) : null
    }

    const participantIp = getParticipantIp(killer.id)

    await tx.headToHead.upsert({
      where: { killerId_victimId: { killerId: killer.id, victimId: victim.id } },
      update: { killCount: { increment: 1 }, lastKillAt: new Date() },
      create: { killerId: killer.id, victimId: victim.id, killCount: 1, lastKillAt: new Date() },
    })

    await tx.eventParticipant.create({
      data: {
        killId: kill.id,
        playerId: killer.id,
        role: 'KILLER',
        mmrChange: killerMMRChange,
        damageDone: killerDamage,
        healingDone: killerHealing,
        ip: getParticipantIp(killer.id),
      },
    })

    await tx.eventParticipant.create({
      data: {
        killId: kill.id,
        playerId: victim.id,
        role: 'VICTIM',
        mmrChange: victimMMRChange,
        damageDone: victimDamage,
        healingDone: victimHealing,
        ip: getParticipantIp(victim.id),
      },
    })

    // Upsert WeaponStats for killer, victim, and assisters
    const kwFamily = extractWeaponFamily(kill.killerWeapon)
    const kwKey = extractWeaponKey(kill.killerWeapon)
    if (kwFamily && kwKey) {
      await tx.weaponStats.upsert({
        where: { playerId_weaponKey: { playerId: killer.id, weaponKey: kwKey } },
        update: { kills: { increment: 1 } },
        create: { playerId: killer.id, weaponKey: kwKey, weaponFamily: kwFamily, kills: 1, deaths: 0 },
      })
    }

    const vwFamily = extractWeaponFamily(kill.victimWeapon)
    const vwKey = extractWeaponKey(kill.victimWeapon)
    if (vwFamily && vwKey) {
      await tx.weaponStats.upsert({
        where: { playerId_weaponKey: { playerId: victim.id, weaponKey: vwKey } },
        update: { deaths: { increment: 1 } },
        create: { playerId: victim.id, weaponKey: vwKey, weaponFamily: vwFamily, kills: 0, deaths: 1 },
      })
    }

    for (const a of assisters) {
      await tx.player.update({
        where: { id: a.player.id },
        data: {
          mmr: { increment: a.mmrChange },
          assists: { increment: 1 },
        },
      })

      await tx.eventParticipant.create({
        data: {
          killId: kill.id,
          playerId: a.player.id,
          role: 'ASSISTER',
          mmrChange: a.mmrChange,
          damageDone: a.damage,
          healingDone: a.healing,
          ip: getParticipantIp(a.player.id),
        },
      })

      const awType = extractWeaponType(a.equipment)
      const awFamily = extractWeaponFamily(awType)
      const awKey = extractWeaponKey(awType)
      if (awFamily && awKey) {
        await tx.weaponStats.upsert({
          where: { playerId_weaponKey: { playerId: a.player.id, weaponKey: awKey } },
          update: { kills: { increment: 1 } },
          create: { playerId: a.player.id, weaponKey: awKey, weaponFamily: awFamily, kills: 1, deaths: 0 },
        })
      }
    }
  })

  return true
}

async function sync(): Promise<number> {
  const syncState = await prisma.syncState.findFirst({ orderBy: { id: 'desc' } })
  const lastEventId = syncState?.lastEventId ?? 0

  const events = await fetchAllRecentEvents(lastEventId)
  if (events.length === 0) return 0

  log(`Fetched ${events.length} new events since EventId ${lastEventId}`)

  const depthsEvents = events.filter(
    (event) => isDepthsKill(event) && isValidKillEvent(event)
  )
  log(`Depths-filtered: ${depthsEvents.length}`)

  // Collect all victim inventory items across all events for bulk pricing
  const allInvItems: { Type: string; Quality: number }[] = []
  for (const event of depthsEvents) {
    const inv = event.Victim?.Inventory
    if (inv) {
      for (const item of inv) {
        if (item?.Type) {
          allInvItems.push({ Type: item.Type, Quality: item.Quality ?? 1 })
        }
      }
    }
  }

  const priceMap = allInvItems.length > 0 ? await getPrices(allInvItems) : undefined

  let syncedCount = 0
  let highestEventId = lastEventId

  for (const event of depthsEvents) {
    try {
      const synced = await processEvent(event, priceMap)
      if (synced) syncedCount++
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Event already exists — skip silently
      } else {
        log(`Failed to process event ${event.EventId}: ${error instanceof Error ? error.message : error}`)
      }
    }
    if (event.EventId > highestEventId) highestEventId = event.EventId
  }

  if (syncedCount === 0) return 0

  await prisma.syncState.upsert({
    where: { id: syncState?.id ?? 0 },
    update: { lastEventId: highestEventId },
    create: { lastEventId: highestEventId },
  })

  await prisma.syncLog.create({
    data: {
      status: 'success',
      message: `Synced ${syncedCount} new kills`,
      killsSynced: syncedCount,
    },
  })

  log(`Synced ${syncedCount} new kills. Highest EventId: ${highestEventId}`)

  return syncedCount
}

async function main() {
  log('Starting Albion Depths sync worker...')
  log(`Poll interval: ${POLL_INTERVAL_MS}ms`)

  while (true) {
    try {
      await sync()
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      log(`Sync error: ${msg}`)
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
