import * as fs from 'fs'
import * as path from 'path'

const ITEMS_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.txt'

// Extract the weapon family code from a full item type (e.g. "T8_2H_BOW_KEEPER" -> "BOW")
function extractFamily(itemType: string, slot: string): string | null {
  const parts = itemType.split('_')
  let i = 1 // skip T{tier}
  while (i < parts.length && /^\d+$/.test(parts[i])) i++
  // skip the slot token
  const slotIdx = parts.findIndex((p, idx) => idx >= i && (p === 'MAIN' || p === '2H' || p === 'OFF' || p === '1H'))
  if (slotIdx < 0) {
    // If slot not found explicitly, use position after tier
    while (i < parts.length && !['MAIN', '2H', 'OFF', '1H'].includes(parts[i])) i++
    if (i < parts.length) i++
  } else {
    i = slotIdx + 1
  }
  if (i >= parts.length) return null
  return parts[i]
}

// Extract the full item type without tier prefix
function extractTypeKey(itemType: string): string {
  return itemType.replace(/^T\d+_/, '')
}

// Known artifact tokens that should be stripped for family extraction
const ARTIFACT_TOKENS = new Set([
  'AVALON', 'HELL', 'MORGANA', 'KEEPER', 'UNDEAD', 'CRYSTAL',
  'SET1', 'SET2', 'SET3',
])

const SLOT_TOKENS = new Set(['MAIN', '2H', 'OFF', '1H'])

function isWeapon(itemType: string): boolean {
  // Must start with T{tier}
  if (!/^T\d+_/.test(itemType)) return false
  // Must have a slot token
  const parts = itemType.split('_')
  const hasSlot = parts.some(p => SLOT_TOKENS.has(p))
  if (!hasSlot) return false
  // Exclude tools, offhands that aren't weapons
  if (itemType.includes('TOOL') || itemType.includes('OFF_SHIELD') || itemType.includes('OFF_TORCH') || itemType.includes('OFF_TOME') || itemType.includes('OFF_HORN') || itemType.includes('OFF_TOTEM') || itemType.includes('OFF_DEMON') || itemType.includes('OFF_UNDEAD') || itemType.includes('OFF_CRYSTAL') || itemType.includes('OFF_SARCOPHAGUS') || itemType.includes('OFF_LAMP') || itemType.includes('OFF_ORB') || itemType.includes('OFF_BANNER') || itemType.includes('OFF_SPHERE') || itemType.includes('OFF_TALISMAN') || itemType.includes('OFF_TROPHY')) return false
  // Exclude capes, mounts, etc.
  if (itemType.includes('CAPE') || itemType.includes('MOUNT') || itemType.includes('ARMOR') || itemType.includes('HEAD_') || itemType.includes('SHOES') || itemType.includes('BAG') || itemType.includes('POTION') || itemType.includes('FOOD') || itemType.includes('FURNITURE') || itemType.includes('SKILLBOOK') || itemType.includes('QUESTITEM') || itemType.includes('FARM_') || itemType.includes('FISH') || itemType.includes('TOOL_') || itemType.includes('CONSUMABLE')) return false
  return true
}

interface WeaponEntry {
  typeKey: string
  familyCode: string
  displayName: string
}

async function main() {
  console.log('Fetching items.txt...')
  const resp = await fetch(ITEMS_URL)
  const text = await resp.text()
  console.log(`Downloaded ${(text.length / 1024 / 1024).toFixed(1)}MB`)

  const lines = text.split('\n')
  const weapons: WeaponEntry[] = []
  const seenKeys = new Set<string>()

  for (const line of lines) {
    const sep = line.indexOf(':')
    if (sep < 0) continue
    const itemType = line.slice(0, sep).trim()
    const displayName = line.slice(sep + 1).trim()
    if (!displayName || displayName.startsWith('T')) continue // skip entries without proper display name

    if (!isWeapon(itemType)) continue

    const cleanType = itemType.split('@')[0] // remove enchantment
    const typeKey = extractTypeKey(cleanType)

    // Skip duplicates (same typeKey but different tier)
    if (seenKeys.has(typeKey)) continue
    seenKeys.add(typeKey)

    // Determine slot
    const parts = cleanType.split('_')
    const slot = parts.find(p => SLOT_TOKENS.has(p)) || 'UNKNOWN'

    const family = extractFamily(cleanType, slot)
    if (!family) continue

    weapons.push({ typeKey, familyCode: family, displayName })
  }

  // Sort by family then display name
  weapons.sort((a, b) => {
    if (a.familyCode !== b.familyCode) return a.familyCode.localeCompare(b.familyCode)
    return a.displayName.localeCompare(b.displayName)
  })

  console.log(`\nFound ${weapons.length} unique weapon variants across ${new Set(weapons.map(w => w.familyCode)).size} families\n`)

  // Output TypeScript map
  console.log('// Weapon variant key -> { displayName, familyCode }')
  console.log('export const WEAPON_MAP: Record<string, { displayName: string; familyCode: string }> = {')
  for (const w of weapons) {
    console.log(`  '${w.typeKey}': { displayName: '${w.displayName.replace(/'/g, "\\'")}', familyCode: '${w.familyCode}' },`)
  }
  console.log('}')

  // Output category grouping
  const families = new Map<string, string[]>()
  for (const w of weapons) {
    if (!families.has(w.familyCode)) families.set(w.familyCode, [])
    families.get(w.familyCode)!.push(w.typeKey)
  }
  console.log('\n// Weapon family -> list of type keys')
  console.log('export const FAMILY_WEAPONS: Record<string, string[]> = {')
  for (const [family, keys] of families) {
    console.log(`  '${family}': [${keys.map(k => `'${k}'`).join(', ')}],`)
  }
  console.log('}')
}

main().catch(console.error)
