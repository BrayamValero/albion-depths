import * as fs from 'fs'
import * as path from 'path'

const ITEMS_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.txt'
const OUTPUT = path.resolve('src/lib/weapon-data.ts')

const SLOT_TOKENS = new Set(['MAIN', '2H', 'OFF', '1H'])

interface WeaponEntry {
  typeKey: string
  familyCode: string
  displayName: string
  slot: string
}

function cleanDisplayName(raw: string): string {
  // Strip "Elder's " prefix
  let name = raw.replace(/^Elder's\s+/, '')
  // Strip "Adept's / Expert's / Master's / Grandmaster's" prefixes (rare for T8 but just in case)
  name = name.replace(/^(Adept's|Expert's|Master's|Grandmaster's|Journeyman's|Novice's|Beginner's)\s+/, '')
  // Handle a few special names
  name = name.trim()
  return name
}

function extractFamily(itemType: string): string | null {
  const parts = itemType.split('_')
  let i = 1
  while (i < parts.length && /^\d+$/.test(parts[i])) i++
  while (i < parts.length && SLOT_TOKENS.has(parts[i])) i++
  if (i >= parts.length) return null
  return parts[i]
}

function isWeapon(itemType: string): boolean {
  if (!/^T\d+_/.test(itemType)) return false
  const parts = itemType.split('_')
  const hasSlot = parts.some(p => SLOT_TOKENS.has(p))
  if (!hasSlot) return false
  if (itemType.includes('TOOL_') || itemType.includes('TOOL@')) return false
  if (itemType.includes('OFF_')) return false
  if (itemType.includes('CAPE_') || itemType.includes('MOUNT_')) return false
  if (itemType.includes('POTION_') || itemType.includes('FOOD_')) return false
  if (itemType.includes('FARM_') || itemType.includes('FISH_')) return false
  if (itemType.includes('SKILLBOOK_')) return false
  if (itemType.includes('QUESTITEM_')) return false
  if (itemType.includes('FURNITURE_')) return false
  if (itemType.includes('CONSUMABLE_')) return false
  if (itemType.includes('ARTEFACT_')) return false
  if (itemType.includes('TROPHY_')) return false
  if (itemType.includes('CRAFTING_')) return false
  if (itemType.includes('LABOURER_')) return false
  if (itemType.includes('WOOD_') || itemType.includes('PLANK_')) return false
  if (itemType.includes('FIBER_') || itemType.includes('CLOTH_')) return false
  if (itemType.includes('HIDE_') || itemType.includes('LEATHER_')) return false
  if (itemType.includes('ORE_') || itemType.includes('METALBAR_')) return false
  if (itemType.includes('ROCK_') || itemType.includes('STONEBLOCK_')) return false
  if (itemType.includes('HEAD_') || itemType.includes('SHOES_') || itemType.includes('ARMOR_')) return false
  if (itemType.includes('BAG_')) return false
  return true
}

async function main() {
  console.log('Fetching items.txt...')
  const resp = await fetch(ITEMS_URL)
  const text = await resp.text()
  console.log(`Downloaded ${(text.length / 1024 / 1024).toFixed(1)}MB`)

  const lines = text.split('\n')
  const weapons: WeaponEntry[] = []
  const seenKeys = new Map<string, WeaponEntry>()

  for (const line of lines) {
    const sep = line.lastIndexOf(':')
    if (sep < 0) continue
    const rawItem = line.slice(0, sep).trim()
    const rawName = line.slice(sep + 1).trim()
    if (!rawName) continue
    // Strip line number prefix (e.g. "6265: T8_2H_BOW" -> "T8_2H_BOW")
    const itemParts = rawItem.split(':')
    const itemType = itemParts.length > 1 ? itemParts[itemParts.length - 1].trim() : rawItem

    if (!itemType.startsWith('T8_')) continue
    if (itemType.includes('@')) continue
    if (!isWeapon(itemType)) continue

    const typeKey = itemType.replace(/^T\d+_/, '')
    const family = extractFamily(itemType)
    if (!family) continue

    const slot = itemType.split('_').find(p => SLOT_TOKENS.has(p)) || '2H'
    const displayName = cleanDisplayName(rawName)

    // Blocklist: items that exist in items.txt but aren't real weapons
    if (typeKey === '2H_IRONGAUNTLETS_HELL') continue

    seenKeys.set(typeKey, { typeKey, familyCode: family, displayName, slot })
  }

  for (const w of seenKeys.values()) {
    weapons.push(w)
  }

  weapons.sort((a, b) => {
    if (a.familyCode !== b.familyCode) return a.familyCode.localeCompare(b.familyCode)
    return a.displayName.localeCompare(b.displayName)
  })

  console.log(`Found ${weapons.length} unique weapon variants across ${new Set(weapons.map(w => w.familyCode)).size} families`)

  // Build category grouping
  // This is the manual mapping of family codes to display categories
  const CATEGORIES: Record<string, string[]> = {
    'Bow': ['BOW', 'LONGBOW', 'WARBOW'],
    'Crossbow': ['CROSSBOW', 'CROSSBOWLARGE', '1HCROSSBOW', 'REPEATINGCROSSBOW', 'DUALCROSSBOW'],
    'Curse Staff': ['CURSEDSTAFF', 'DEMONICSTAFF', 'SKULLORB'],
    'Fire Staff': ['FIRE', 'FIRESTAFF', 'INFERNOSTAFF'],
    'Frost Staff': ['FROSTSTAFF', 'GLACIALSTAFF', 'ICECRYSTAL', 'ICEGAUNTLETS'],
    'Arcane Staff': ['ARCANESTAFF', 'ENIGMATICSTAFF', 'ENIGMATICORB', 'ARCANE'],
    'Holy Staff': ['HOLYSTAFF', 'DIVINESTAFF'],
    'Nature Staff': ['NATURESTAFF', 'WILDSTAFF'],
    'Dagger': ['DAGGER', 'DAGGERPAIR', 'CLAWPAIR', 'RAPIER', 'DUALSICKLE'],
    'Spear': ['SPEAR', 'GLAIVE', 'HARPOON', 'TRIDENT'],
    'Sword': ['SWORD', 'CLAYMORE', 'DUALSWORD', 'SCIMITAR', 'CLEAVER', 'DUALSCIMITAR'],
    'Axe': ['AXE', 'HALBERD', 'SCYTHE', 'DUALAXE'],
    'Quarterstaff': ['QUARTERSTAFF', 'IRONCLADEDSTAFF', 'DOUBLEBLADEDSTAFF', 'COMBATSTAFF', 'TWINSCYTHE', 'ROCKSTAFF'],
    'Hammer': ['HAMMER', 'POLEHAMMER', 'DUALHAMMER', 'RAM'],
    'Mace': ['MACE', 'ROCKMACE', 'FLAIL', 'DUALMACE'],
    'War Gloves': ['KNUCKLES'],
    'Shapeshifter Staff': ['SHAPESHIFTER'],
  }

  // Build category lookup: familyCode -> category name
  const familyToCategory: Record<string, string> = {}
  for (const [cat, families] of Object.entries(CATEGORIES)) {
    for (const f of families) {
      familyToCategory[f] = cat
    }
  }

  // Check for weapons with unknown categories
  const unknown = new Set<string>()
  for (const w of weapons) {
    if (!familyToCategory[w.familyCode]) {
      unknown.add(`${w.familyCode} (${w.displayName})`)
    }
  }
  if (unknown.size > 0) {
    console.log('\nWARNING: Unknown categories:')
    for (const u of unknown) console.log(`  ${u}`)
  }

  // Generate TypeScript file
  let output = `// Auto-generated by scripts/generate-weapon-data.ts
// Last generated: ${new Date().toISOString()}
// Source: ${ITEMS_URL}

export interface WeaponInfo {
  displayName: string
  familyCode: string
  slot: string
}

export const WEAPON_DATA: Record<string, WeaponInfo> = {\n`
  for (const w of weapons) {
    const [slot] = w.slot
    output += `  '${w.typeKey}': { displayName: '${w.displayName.replace(/'/g, "\\'")}', familyCode: '${w.familyCode}', slot: '${w.slot}' },\n`
  }
  output += `}\n\n`

  // FAMILY_WEAPONS map
  const families = new Map<string, string[]>()
  for (const w of weapons) {
    if (!families.has(w.familyCode)) families.set(w.familyCode, [])
    families.get(w.familyCode)!.push(w.typeKey)
  }

  output += 'export const FAMILY_WEAPONS: Record<string, string[]> = {\n'
  for (const [family, keys] of families) {
    output += `  '${family}': [${keys.map(k => `'${k}'`).join(', ')}],\n`
  }
  output += `}\n\n`

  // CATEGORIES map
  output += 'export const CATEGORIES: Record<string, string[]> = {\n'
  for (const [cat, families] of Object.entries(CATEGORIES)) {
    output += `  '${cat}': [${families.map(f => `'${f}'`).join(', ')}],\n`
  }
  output += `}\n\n`

  // familyToCategory map
  output += 'export const FAMILY_CATEGORY: Record<string, string> = {\n'
  for (const [cat, families] of Object.entries(CATEGORIES)) {
    for (const f of families) {
      output += `  '${f}': '${cat}',\n`
    }
  }
  output += `}\n\n`

  // Export all category names
  output += `export const CATEGORY_NAMES: string[] = [\n`
  for (const cat of Object.keys(CATEGORIES)) {
    output += `  '${cat}',\n`
  }
  output += `]\n`

  fs.writeFileSync(OUTPUT, output)
  console.log(`\nWrote ${OUTPUT}`)
  console.log(`  ${weapons.length} weapon variants`)
  console.log(`  ${families.size} families`)
  console.log(`  ${Object.keys(CATEGORIES).length} categories`)
}

main().catch(console.error)
