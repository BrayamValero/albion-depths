import { RankingsTable } from "@/components/RankingsTable";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { prisma } from "@/lib/prisma";
import { getTier, TIER_THRESHOLDS } from "@/lib/mmr";
import type { Tier } from "@/lib/types";
import Link from "next/link";

export const metadata = {
  title: "Rankings - Albion Depths Killboard",
  description: "MMR rankings for The Depths",
};

interface Props {
  searchParams: Promise<{ page?: string; perPage?: string; tier?: string }>;
}

export default async function RankingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const perPage = Math.min(100, Math.max(10, parseInt(params.perPage || "10")));
  const limit = perPage;
  const tier = params.tier as Tier | undefined;

  const tierBounds: Record<string, { gte: number; lt: number }> = {};
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    const t = TIER_THRESHOLDS[i];
    const nextTier = TIER_THRESHOLDS[i - 1];
    tierBounds[t.tier] = { gte: t.minMMR, lt: nextTier?.minMMR ?? 99999 };
  }

  const where = tier
    ? {
        mmr: {
          gte: tierBounds[tier]?.gte ?? 0,
          lt: tierBounds[tier]?.lt ?? 99999,
        },
      }
    : {};

  const [players, total] = await Promise.all([
    prisma.player.findMany({
      where,
      orderBy: { mmr: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.player.count({ where }),
  ]);

  const data = players.map((player, index) => ({
    id: player.id,
    name: player.name,
    mmr: player.mmr,
    tier: getTier(player.mmr),
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    kd:
      player.deaths > 0
        ? Number(((player.kills + player.assists) / player.deaths).toFixed(2))
        : player.kills + player.assists,
    streak: player.streak,
    rank: (page - 1) * limit + index + 1,
  }));

  const totalPages = Math.ceil(total / limit);
  const tiers: (Tier | undefined)[] = [
    undefined,
    ...TIER_THRESHOLDS.map((t) => t.tier).reverse(),
  ];

  const tierParam = tier ? `&tier=${tier}` : "";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight gothic-title text-text-primary">
          Rankings
        </h1>
        <p className="text-text-muted mt-1">MMR leaderboard for The Depths</p>
      </div>

      <div className="mb-6">
        <SearchBar />
      </div>

      <div className="flex gap-2 mb-6">
        {tiers.map((t) => (
          <Link
            key={t || "all"}
            href={`/rankings?page=1${t ? `&tier=${t}` : ""}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tier === t
                ? "bg-accent text-white"
                : "bg-surface border border-border text-text-secondary hover:bg-surfaceHover"
            }`}
          >
            {t || "All"}
          </Link>
        ))}
      </div>

      <RankingsTable players={data} />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        perPage={perPage}
        urlPattern={`?page={page}&perPage={perPage}${tierParam}`}
        showPerPageSelector
      />
    </div>
  );
}
