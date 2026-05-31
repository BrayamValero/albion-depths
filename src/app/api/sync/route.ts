import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  fetchAllRecentEvents,
  isDepthsKill,
  isValidKillEvent,
  extractWeaponType,
} from '@/lib/albion-api'
import { calculateMMRChange, calculatePartyAvgMMR, STARTING_MMR } from '@/lib/mmr'
import { extractWeaponFamily, extractWeaponKey } from '@/lib/weapons'
import { getPrices, calcValue } from '@/lib/pricing'
import { AlbionKillEvent } from '@/lib/types'

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

export async function POST() {
  try {
    const syncState = await prisma.syncState.findFirst({ orderBy: { id: 'desc' } })
    const lastEventId = syncState?.lastEventId ?? 0

    const events = await fetchAllRecentEvents(lastEventId)
    console.log(`Fetched ${events.length} new events since EventId ${lastEventId}`)

    const depthsEvents = events.filter(
      (event) => isDepthsKill(event) && isValidKillEvent(event)
    )
    console.log(`Depths-filtered events: ${depthsEvents.length}`)

    let syncedCount = 0
    let highestEventId = lastEventId

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

    for (const event of depthsEvents) {
      const existingKill = await prisma.kill.findUnique({
        where: { eventId: String(event.EventId) },
      })
      if (existingKill) continue

      const killerData = event.Killer
      const victimData = event.Victim

      const killer = await ensurePlayer(killerData.Id, killerData.Name)
      const victim = await ensurePlayer(victimData.Id, victimData.Name)

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

      try {
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

        if (event.EventId > highestEventId) {
          highestEventId = event.EventId
        }

        syncedCount++
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          // Event already exists — skip silently
        } else {
          throw error
        }
      }
    }

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

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      totalProcessed: depthsEvents.length,
      highestEventId,
    })
  } catch (error) {
    console.error('Sync error:', error)

    await prisma.syncLog.create({
      data: {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        killsSynced: 0,
      },
    })

    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
