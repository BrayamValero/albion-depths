import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTier } from "@/lib/mmr";
import { TierBadge } from "@/components/TierBadge";
import { Pagination } from "@/components/Pagination";
import {
  getWeaponInfo,
  getWeaponCategory,
  getDisplayName,
  getIconUrl,
} from "@/lib/weapons";

interface Props {
  params: Promise<{ category: string; sub: string }>;
  searchParams: Promise<{ page?: string; perPage?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { sub, category } = await params;
  const weaponKey = decodeURIComponent(sub);
  return {
    title: `${getDisplayName(weaponKey)} Leaderboard - Albion Depths Killboard`,
    description: `Top ${getDisplayName(weaponKey)} players in The Depths`,
  };
}

export default async function WeaponSubPage({ params, searchParams }: Props) {
  const { category, sub } = await params;
  const weaponKey = decodeURIComponent(sub);
  const cat = decodeURIComponent(category);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const perPage = Math.min(50, Math.max(1, parseInt(sp.perPage || "10")));

  const info = getWeaponInfo(weaponKey);
  const catName = info ? getWeaponCategory(info.familyCode) : null;
  const displayName = getDisplayName(weaponKey);
  const iconUrl = getIconUrl(weaponKey);

  if (!catName || catName !== cat) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          href="/weapons"
          className="text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          &larr; All Weapons
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight gothic-title text-text-primary mt-1">
          Unknown Weapon
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Weapon &ldquo;{weaponKey}&rdquo; not found in category &ldquo;{cat}
          &rdquo;.
        </p>
      </div>
    );
  }

  const [total, stats] = await Promise.all([
    prisma.weaponStats.count({
      where: { weaponKey, kills: { gte: 1 } },
    }),
    prisma.weaponStats.findMany({
      where: { weaponKey, kills: { gte: 1 } },
      include: { player: { select: { id: true, name: true, mmr: true } } },
      orderBy: { kills: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  const ranked = stats
    .map((s) => ({
      playerId: s.player.id,
      playerName: s.player.name,
      mmr: s.player.mmr,
      tier: getTier(s.player.mmr),
      kills: s.kills,
      deaths: s.deaths,
      kd: s.deaths > 0 ? Math.round((s.kills / s.deaths) * 100) / 100 : s.kills,
    }))
    .sort((a, b) => {
      const kdDiff = b.kd - a.kd;
      if (kdDiff !== 0) return kdDiff;
      return b.kills - a.kills;
    })
    .map((entry, i) => ({ ...entry, rank: (page - 1) * perPage + i + 1 }));

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/weapons/${encodeURIComponent(cat)}`}
          className="text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          &larr; {cat}
        </Link>
        <div className="flex items-center gap-3 mt-1">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={displayName}
              className="w-10 h-10 object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight gothic-title text-text-primary">
              {displayName}
            </h1>
            <p className="text-text-muted text-sm">
              {ranked.length} players ranked by K/D
            </p>
          </div>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-text-muted">
            No kills recorded with this weapon yet.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-muted font-medium">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium">
                    Player
                  </th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium">
                    Tier
                  </th>
                  <th className="text-right py-3 px-4 text-text-muted font-medium">
                    K/D
                  </th>
                  <th className="text-right py-3 px-4 text-text-muted font-medium">
                    Kills
                  </th>
                  <th className="text-right py-3 px-4 text-text-muted font-medium">
                    Deaths
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((entry) => (
                  <tr
                    key={entry.playerId}
                    className="border-b border-border hover:bg-surfaceHover transition-colors"
                  >
                    <td className="py-3 px-4 w-20 text-text-muted font-mono">
                      #{entry.rank}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/player/${entry.playerId}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {entry.playerName}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <TierBadge tier={entry.tier} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {entry.kd.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-green-500">
                      {entry.kills.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-red-500">
                      {entry.deaths.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            perPage={perPage}
            urlPattern="?page={page}&perPage={perPage}"
            showPerPageSelector
          />
        </>
      )}
    </div>
  );
}
