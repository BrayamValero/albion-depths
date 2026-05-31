export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCategories, getCategoryWeapons, getWeaponCategory, getIconUrl } from '@/lib/weapons'

export const metadata = {
  title: 'Weapons - Albion Depths Killboard',
  description: 'Browse weapon leaderboards for The Depths',
}

export default async function WeaponsPage() {
  const categories = getCategories()

  let catCountMap = new Map<string, number>()
  try {
    const rows = await prisma.weaponStats.groupBy({
      by: ['weaponFamily'],
      _count: { playerId: true },
    })
    for (const r of rows) {
      const cat = getWeaponCategory(r.weaponFamily)
      if (cat) {
        catCountMap.set(cat, (catCountMap.get(cat) || 0) + r._count.playerId)
      }
    }
  } catch {
    // Database not available during prerender
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight gothic-title text-text-primary">Weapons</h1>
        <p className="text-text-muted text-sm mt-1">Browse leaderboards by weapon category</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const weapons = getCategoryWeapons(cat)
          const playerCount = catCountMap.get(cat) ?? 0
          return (
            <Link
              key={cat}
              href={`/weapons/${encodeURIComponent(cat)}`}
              className="card card-hover group p-4 flex flex-col items-center gap-3 text-center transition-all duration-300 hover:border-accent/40"
            >
              <div className="flex items-center gap-1.5 flex-wrap justify-center min-h-[40px]">
                {weapons.slice(0, 5).map((w) => {
                  const url = getIconUrl(w.typeKey)
                  return url ? (
                    <img
                      key={w.typeKey}
                      src={url}
                      alt={w.displayName}
                      className="w-8 h-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null
                })}
              </div>
              <h2 className="font-bold text-text-primary text-sm">{cat}</h2>
              <p className="text-text-muted text-xs">{weapons.length} weapons &middot; {playerCount} players</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
