import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCategoryWeapons, getCategories } from "@/lib/weapons";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const name = decodeURIComponent(category);
  return {
    title: `${name} - Weapons - Albion Depths Killboard`,
    description: `Browse ${name} weapons in The Depths`,
  };
}

export default async function WeaponCategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = decodeURIComponent(category);

  const allCats = getCategories();
  if (!allCats.includes(cat)) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          href="/weapons"
          className="text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          &larr; All Weapons
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight gothic-title text-text-primary mt-1">
          Unknown Category
        </h1>
        <p className="text-text-muted text-sm mt-1">
          No weapon category &ldquo;{cat}&rdquo; found.
        </p>
      </div>
    );
  }

  const weapons = getCategoryWeapons(cat);
  const typeKeys = weapons.map((w) => w.typeKey);

  const rows =
    typeKeys.length > 0
      ? await prisma.weaponStats.groupBy({
          by: ["weaponKey"],
          _count: { playerId: true },
          _sum: { kills: true },
          where: { weaponKey: { in: typeKeys } },
        })
      : [];

  const statsMap = new Map(
    rows.map((r) => [
      r.weaponKey,
      { kills: r._sum.kills ?? 0, players: r._count.playerId },
    ]),
  );

  const ranked = weapons
    .map((w) => ({
      ...w,
      kills: statsMap.get(w.typeKey)?.kills ?? 0,
      players: statsMap.get(w.typeKey)?.players ?? 0,
    }))
    .sort((a, b) => b.kills - a.kills)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/weapons"
          className="text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          &larr; All Weapons
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight gothic-title text-text-primary mt-1">
          {cat}
        </h1>
        <p className="text-text-muted text-sm mt-1">{ranked.length} weapons</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {ranked.map((entry) => {
          return (
            <Link
              key={entry.typeKey}
              href={`/weapons/${encodeURIComponent(cat)}/${entry.typeKey}`}
              className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface/50 hover:bg-surfaceHover hover:border-accent/40 hover:scale-[1.02] transition-all duration-200"
            >
              {entry.iconUrl ? (
                <img
                  src={entry.iconUrl}
                  alt={entry.displayName}
                  className="w-14 h-14 object-contain mt-2 group-hover:scale-110 transition-transform duration-200"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-surface/50 flex items-center justify-center text-text-muted text-xs mt-2">
                  ?
                </div>
              )}
              <span className="font-medium text-text-primary group-hover:text-accent text-sm text-center leading-tight transition-colors">
                {entry.displayName}
              </span>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="text-green-500 font-mono">
                  {entry.kills.toLocaleString()} kills
                </span>
                <span>{entry.players} players</span>
              </div>
              <span className="text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                View &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
