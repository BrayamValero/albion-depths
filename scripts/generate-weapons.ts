const SLOT_TOKENS = new Set(['MAIN', '2H', 'OFF', '1H'])

const OUT_FILE = 'src/lib/weapon-data.ts'

interface RawWeaponInfo {
  displayName: string
  slot: string
}

function extractFamily(itemType: string): string | null {
  const clean = itemType.split('@')[0]
  const parts = clean.split('_')
  if (parts.length < 2) return null

  let i = 1
  while (i < parts.length && /^\d+$/.test(parts[i])) i++
  while (i < parts.length && SLOT_TOKENS.has(parts[i])) i++

  if (i >= parts.length) return null
  return parts[i]
}

function extractSlot(itemType: string): string | null {
  const clean = itemType.split('@')[0]
  const parts = clean.split('_')
  if (parts.length < 3) return null

  const slot = parts[1]
  if (SLOT_TOKENS.has(slot) && slot !== 'OFF') return slot
  return null
}

const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  '1HCROSSBOW': '1H Crossbow',
  ARCANESTAFF: 'Arcane Staff',
  ARCANE: 'Arcane Staff',
  BADONICBOW: 'Badonic Bow',
  BATTLEAXE: 'Battleaxe',
  BEDROCKMACE: 'Bedrock Mace',
  BLACKFROSTSTAFF: 'Black Frost Staff',
  BLAZESTAFF: 'Blaze Staff',
  BLIGHTSTAFF: 'Blight Staff',
  BLOODLETTER: 'Bloodletter',
  BOLTCASTERS: 'Boltcasters',
  BRIMSTONESTAFF: 'Brimstone Staff',
  BROADSWORD: 'Broadsword',
  BROOM: 'Broom',
  CARVINGSWORD: 'Carving Sword',
  CLAWPAIR: 'Claw Pair',
  CLAYMORE: 'Claymore',
  CLEAVER: 'Cleaver',
  CLOAKEDSWORD: 'Cloaked Sword',
  CLOBBERERMACE: 'Clobberer Mace',
  CROSSBOWLARGE: 'Heavy Crossbow',
  CURSEDSTAFF: 'Cursed Staff',
  DAGGERPAIR: 'Dagger Pair',
  DAYBREAKER: 'Daybreaker',
  DEATHGIVERS: 'Death Givers',
  DEMONFANG: 'Demonfang',
  DEMONICSTAFF: 'Demonic Staff',
  DIVINESTAFF: 'Divine Staff',
  DOUBLEBLADEDSTAFF: 'Double Bladed Staff',
  DRUIDICSTAFF: 'Druidic Staff',
  DUALAXE: 'Dual Axe',
  DUALCROSSBOW: 'Dual Crossbow',
  DUALHAMMER: 'Dual Hammer',
  DUALMACE: 'Dual Mace',
  DUALSCIMITAR: 'Dual Scimitar',
  DUALSICKLE: 'Dual Sickle',
  DUALSWORD: 'Dual Sword',
  ENIGMATICORB: 'Enigmatic Orb',
  ENIGMATICSTAFF: 'Enigmatic Staff',
  FALLENSTAFF: 'Fallen Staff',
  FIRESTAFF: 'Fire Staff',
  FORGINGHAMMER: 'Forging Hammer',
  FROSTSTAFF: 'Frost Staff',
  GLACIALSTAFF: 'Glacial Staff',
  GLAIVE: 'Glaive',
  GREATFROSTSTAFF: 'Great Frost Staff',
  GREATAXE: 'Greataxe',
  HALBERD: 'Halberd',
  HARPOON: 'Harpoon',
  HEAVYCROSSBOW: 'Heavy Crossbow',
  HEAVYHAMMER: 'Heavy Hammer',
  HEAVYMACE: 'Heavy Mace',
  HOLYSTAFF: 'Holy Staff',
  ICECRYSTAL: 'Ice Crystal',
  ICEGAUNTLETS: 'Ice Gauntlets',
  INCUBUSMACE: 'Incubus Mace',
  INFERNALSCYTHE: 'Infernal Scythe',
  INFERNOSTAFF: 'Infernal Staff',
  IRONCLADEDSTAFF: 'Iron-claded Staff',
  KINGMAKER: 'Kingmaker',
  LIFECURSESTAFF: 'Life Curse Staff',
  LIGHTCROSSBOW: 'Light Crossbow',
  LONGBOW: 'Longbow',
  NATURESTAFF: 'Nature Staff',
  PERMAFROSTSTAFF: 'Permafrost Staff',
  PIKE: 'Pike',
  POLEHAMMER: 'Polehammer',
  QUARTERSTAFF: 'Quarterstaff',
  RAM: 'Ram',
  RAMPANTSTAFF: 'Rampant Staff',
  RAPIER: 'Rapier',
  REDEMPTIONSTAFF: 'Redemption Staff',
  ROCKSTAFF: 'Rock Staff',
  SCIMITAR: 'Scimitar',
  SCYTHE: 'Scythe',
  SHAPESHIFTER: 'Shapeshifter',
  SKULLORB: 'Skull Orb',
  SOULSCYTHE: 'Soul Scythe',
  SPIKEDGAUNTLETS: 'Spiked Gauntlets',
  SPIRITHUNTER: 'Spirit Hunter',
  TOMBHAMMER: 'Tombhammer',
  TRIDENT: 'Trident',
  TWINSCYTHE: 'Twin Scythe',
  TWISTEDSTAFF: 'Twisted Staff',
  WARBOW: 'Warbow',
  WILDFIRESTAFF: 'Wildfire Staff',
  WILDSTAFF: 'Wild Staff',
  WISPSHOT: 'Wispshot',
  WITCHWORKSTAFF: 'Witchwork Staff',
}

function deriveDisplayName(family: string): string {
  if (DISPLAY_NAME_OVERRIDES[family]) return DISPLAY_NAME_OVERRIDES[family]
  return family.charAt(0).toUpperCase() + family.slice(1).toLowerCase()
}

async function main() {
  const { PrismaClient } = require('@prisma/client') as any
  const prisma = new PrismaClient()

  try {
    // Gather all weapon types from the Kill table
    const killerRows = await prisma.kill.findMany({
      select: { killerWeapon: true },
      distinct: ['killerWeapon'],
      where: { killerWeapon: { not: null } },
    })
    const victimRows = await prisma.kill.findMany({
      select: { victimWeapon: true },
      distinct: ['victimWeapon'],
      where: { victimWeapon: { not: null } },
    })

    const rawKiller: string[] = killerRows.map((r: { killerWeapon: string | null }) => r.killerWeapon).filter(Boolean) as string[]
    const rawVictim: string[] = victimRows.map((r: { victimWeapon: string | null }) => r.victimWeapon).filter(Boolean) as string[]
    const allTypes = Array.from(new Set([...rawKiller, ...rawVictim]))

    console.log(`Found ${allTypes.length} unique weapon types in Kill table`)

    // Build slot counts per family
    const slotCounts = new Map<string, Map<string, number>>()
    const families = new Set<string>()

    for (const type of allTypes) {
      const family = extractFamily(type)
      const slot = extractSlot(type)
      if (!family || !slot) continue

      families.add(family)

      if (!slotCounts.has(family)) slotCounts.set(family, new Map())
      const counts = slotCounts.get(family)!
      counts.set(slot, (counts.get(slot) || 0) + 1)
    }

    // Build final weapon data
    const weaponData: Record<string, RawWeaponInfo> = {}
    for (const family of Array.from(families)) {
      const counts = slotCounts.get(family)!
      const slot = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      weaponData[family] = { displayName: deriveDisplayName(family), slot }
    }

    console.log(`Extracted ${Object.keys(weaponData).length} weapon families from DB`)

    // Add families from categories that aren't in DB yet
    const categories: Record<string, string[]> = {
      Axe: ['AXE', 'BATTLEAXE', 'GREATAXE', 'HALBERD', 'DUALAXE', 'CLEAVER', 'INFERNALSCYTHE'],
      Bow: ['BOW', 'LONGBOW', 'WARBOW', 'BADONICBOW', 'WISPSHOT'],
      Crossbow: ['CROSSBOW', 'CROSSBOWLARGE', 'LIGHTCROSSBOW', 'HEAVYCROSSBOW', 'DUALCROSSBOW', '1HCROSSBOW', 'BOLTCASTERS'],
      'Curse Staff': ['CURSEDSTAFF', 'DEMONICSTAFF', 'SKULLORB', 'LIFECURSESTAFF'],
      Dagger: ['DAGGER', 'DAGGERPAIR', 'BLOODLETTER', 'DEATHGIVERS', 'CLAWPAIR', 'DEMONFANG'],
      'Fire Staff': ['FIRESTAFF', 'FIRE', 'INFERNOSTAFF', 'WILDFIRESTAFF', 'BLAZESTAFF', 'BROOM'],
      'Frost Staff': ['FROSTSTAFF', 'GLACIALSTAFF', 'ICECRYSTAL', 'ICEGAUNTLETS', 'PERMAFROSTSTAFF', 'GREATFROSTSTAFF'],
      Hammer: ['HAMMER', 'POLEHAMMER', 'HEAVYHAMMER', 'DUALHAMMER', 'TOMBHAMMER', 'FORGINGHAMMER', 'RAM'],
      'Holy Staff': ['HOLYSTAFF', 'DIVINESTAFF', 'FALLENSTAFF', 'REDEMPTIONSTAFF', 'BLIGHTSTAFF'],
      Mace: ['MACE', 'HEAVYMACE', 'BEDROCKMACE', 'INCUBUSMACE', 'CLOBBERERMACE', 'DUALMACE'],
      'Nature Staff': ['NATURESTAFF', 'WILDSTAFF', 'DRUIDICSTAFF', 'RAMPANTSTAFF'],
      Quarterstaff: ['QUARTERSTAFF', 'DOUBLEBLADEDSTAFF', 'IRONCLADEDSTAFF', 'ROCKSTAFF', 'SOULSCYTHE', 'BLACKFROSTSTAFF', 'BRIMSTONESTAFF'],
      Scythe: ['SCYTHE', 'TWINSCYTHE', 'DUALSICKLE'],
      Shapeshifter: ['SHAPESHIFTER'],
      Spear: ['SPEAR', 'PIKE', 'GLAIVE', 'TRIDENT', 'HARPOON', 'SPIRITHUNTER', 'DAYBREAKER'],
      Sword: ['SWORD', 'BROADSWORD', 'CLAYMORE', 'DUALSWORD', 'DUALSCIMITAR', 'RAPIER', 'SCIMITAR', 'CARVINGSWORD', 'KINGMAKER', 'CLOAKEDSWORD'],
      'Arcane Staff': ['ARCANESTAFF', 'ARCANE', 'ENIGMATICSTAFF', 'WITCHWORKSTAFF', 'TWISTEDSTAFF', 'ENIGMATICORB'],
      Knuckles: ['KNUCKLES', 'SPIKEDGAUNTLETS'],
    }

    for (const fams of Object.values(categories)) {
      for (const f of fams) {
        if (!weaponData[f]) {
          weaponData[f] = { displayName: deriveDisplayName(f), slot: '2H' }
        }
      }
    }

    console.log(`Total weapon families (incl. category-only): ${Object.keys(weaponData).length}`)

    // Generate TypeScript source
    const sortedFamilies = Object.keys(weaponData).sort()
    const lines: string[] = [
      '// Auto-generated by scripts/generate-weapons.ts',
      '// Do not edit manually.',
      '// Source: Kill table weapon types (game API data)',
      '',
      'export interface WeaponInfo {',
      '  displayName: string',
      '  slot: string',
      '}',
      '',
      `export const WEAPON_DATA: Record<string, WeaponInfo> = {`,
    ]

    for (const family of sortedFamilies) {
      const info = weaponData[family]
      const escapedName = info.displayName.replace(/'/g, "\\'")
      lines.push(`  '${family}': { displayName: '${escapedName}', slot: '${info.slot}' },`)
    }

    lines.push('}')
    lines.push('')

    lines.push('export const CATEGORIES: Record<string, string[]> = {')
    for (const [cat, fams] of Object.entries(categories)) {
      const famStr = fams.map(f => `'${f}'`).join(', ')
      lines.push(`  '${cat}': [${famStr}],`)
    }
    lines.push('}')
    lines.push('')

    // Reverse lookup
    lines.push('export const FAMILY_TO_CATEGORY: Record<string, string> = {')
    for (const [cat, fams] of Object.entries(categories)) {
      for (const f of fams) {
        lines.push(`  '${f}': '${cat}',`)
      }
    }
    lines.push('}')

    const source = lines.join('\n') + '\n'

    const fs = await import('node:fs')
    const path = await import('node:path')
    const outPath = path.resolve(OUT_FILE)
    fs.writeFileSync(outPath, source, 'utf-8')
    console.log(`Generated ${OUT_FILE} (${(source.length / 1024).toFixed(1)}KB)`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
