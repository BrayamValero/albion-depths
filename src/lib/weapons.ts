import { WEAPON_DATA, FAMILY_CATEGORY, CATEGORY_NAMES, FAMILY_WEAPONS } from './weapon-data'
import type { WeaponInfo } from './weapon-data'

export type { WeaponInfo }

const SLOT_TOKENS = new Set(['MAIN', '2H', 'OFF', '1H'])

export function extractWeaponFamily(itemType: string | null | undefined): string | null {
  if (!itemType) return null
  const clean = itemType.split('@')[0]
  const parts = clean.split('_')
  if (parts.length < 2) return null

  let i = 1
  while (i < parts.length && /^\d+$/.test(parts[i])) i++
  while (i < parts.length && SLOT_TOKENS.has(parts[i])) i++

  if (i >= parts.length) return null
  return parts[i]
}

export function extractWeaponKey(itemType: string | null | undefined): string | null {
  if (!itemType) return null
  const clean = itemType.split('@')[0]
  const tierMatch = clean.match(/^T\d+_(.*)/)
  if (!tierMatch) return null
  return tierMatch[1]
}

export function getWeaponInfo(typeKey: string): WeaponInfo | null {
  return WEAPON_DATA[typeKey] ?? null
}

export function getWeaponCategory(familyCode: string): string | null {
  return FAMILY_CATEGORY[familyCode] ?? null
}

export function getCategories(): string[] {
  return [...CATEGORY_NAMES]
}

export function getFamilyWeapons(familyCode: string): string[] {
  return FAMILY_WEAPONS[familyCode] ?? []
}

export function getCategoryWeapons(category: string): { typeKey: string; displayName: string; familyCode: string; iconUrl: string | null }[] {
  const result: { typeKey: string; displayName: string; familyCode: string; iconUrl: string | null }[] = []
  for (const [typeKey, info] of Object.entries(WEAPON_DATA)) {
    const cat = FAMILY_CATEGORY[info.familyCode]
    if (cat === category) {
      result.push({
        typeKey,
        displayName: info.displayName,
        familyCode: info.familyCode,
        iconUrl: getIconUrl(typeKey),
      })
    }
  }
  return result.sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export function getDisplayName(typeKey: string): string {
  if (typeKey.includes('_')) {
    const info = WEAPON_DATA[typeKey]
    if (info) return info.displayName
  }
  return typeKey
}

export function getIconUrl(typeKey: string): string | null {
  const weaponInfo = WEAPON_DATA[typeKey]
  if (!weaponInfo) return null
  return `https://render.albiononline.com/v1/item/T8_${typeKey}.png`
}
