import { prisma } from './prisma'

const CACHE_TTL_MS = 60 * 60 * 1000
const API_BASE = 'https://www.albion-online-data.com/api/v2/stats/prices'

export function allEquipItems(equip: Record<string, { Type: string; Count?: number; Quality?: number } | null>): { Type: string; Quality?: number }[] {
  const EQUIP_SLOTS = ['MainHand', 'OffHand', 'Head', 'Armor', 'Shoes', 'Bag', 'Cape', 'Mount', 'Potion', 'Food'] as const
  return EQUIP_SLOTS
    .map((slot) => equip[slot])
    .filter((item): item is { Type: string; Quality?: number } => item != null && Boolean(item.Type))
}

export function calcValue(items: { Type: string; Count?: number; Quality?: number }[], priceMap: Map<string, Map<number, number>>): number {
  return items.reduce((total, item) => {
    const byQ = priceMap.get(item.Type)
    if (!byQ) return total
    const price = byQ.get(item.Quality ?? 1) ?? 0
    return total + price * (item.Count ?? 1)
  }, 0)
}

function deduplicateItems(items: { Type: string; Quality?: number }[]): { Type: string; Quality: number }[] {
  const seen = new Set<string>()
  const result: { Type: string; Quality: number }[] = []
  for (const item of items) {
    if (!item.Type) continue
    const key = `${item.Type}_${item.Quality ?? 1}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ Type: item.Type, Quality: item.Quality ?? 1 })
  }
  return result
}

export async function getPrices(items: { Type: string; Quality?: number }[]): Promise<Map<string, Map<number, number>>> {
  const priceMap = new Map<string, Map<number, number>>()
  const unique = deduplicateItems(items)
  if (unique.length === 0) return priceMap

  const cached = await prisma.priceCache.findMany({
    where: { OR: unique.map(i => ({ itemType: i.Type, quality: i.Quality })) },
  })

  const now = Date.now()
  const fresh = cached.filter(c => now - c.updatedAt.getTime() < CACHE_TTL_MS)
  const stale = cached.filter(c => now - c.updatedAt.getTime() >= CACHE_TTL_MS)

  for (const c of fresh) {
    if (!priceMap.has(c.itemType)) priceMap.set(c.itemType, new Map())
    priceMap.get(c.itemType)!.set(c.quality, c.price)
  }

  const missing = unique.filter(i => !fresh.some(c => c.itemType === i.Type && c.quality === i.Quality))

  if (missing.length > 0) {
    const types = Array.from(new Set(missing.map(i => i.Type)))
    const CHUNK_SIZE = 50
    const apiMap = new Map<string, Map<number, number>>()
    let anySucceeded = false

    for (let i = 0; i < types.length; i += CHUNK_SIZE) {
      const chunk = types.slice(i, i + CHUNK_SIZE)
      try {
        const res = await fetch(`${API_BASE}/${chunk.join(',')}?qualities=1,2,3,4,5`, {
          signal: AbortSignal.timeout(8000),
        })

        if (res.ok) {
          anySucceeded = true
          const data: any[] = await res.json()

          for (const entry of data) {
            const id = entry.item_id
            const q = entry.quality ?? 1
            const p = Math.max(entry.sell_price_min ?? 0, 0)
            if (p <= 0) continue
            if (!apiMap.has(id)) apiMap.set(id, new Map())
            const prev = apiMap.get(id)!.get(q)
            if (prev === undefined || p < prev) apiMap.get(id)!.set(q, p)
          }
        }
      } catch {
        // individual chunk failed — continue with next
      }
    }

    if (anySucceeded) {
      for (const [type, qMap] of Array.from(apiMap.entries())) {
        if (!priceMap.has(type)) priceMap.set(type, new Map())
        for (const [quality, price] of Array.from(qMap.entries())) {
          priceMap.get(type)!.set(quality, price)
          await prisma.priceCache.upsert({
            where: { itemType_quality: { itemType: type, quality } },
            update: { price },
            create: { itemType: type, quality, price },
          }).catch(() => {})
        }
      }
    } else {
      // All chunks failed — fall back to stale cache
      for (const c of stale) {
        if (!priceMap.has(c.itemType)) priceMap.set(c.itemType, new Map())
        priceMap.get(c.itemType)!.set(c.quality, c.price)
      }
    }
  }

  // Fill stale entries not already covered
  for (const c of stale) {
    if (!priceMap.has(c.itemType)) priceMap.set(c.itemType, new Map())
    if (!priceMap.get(c.itemType)!.has(c.quality)) {
      priceMap.get(c.itemType)!.set(c.quality, c.price)
    }
  }

  return priceMap
}
