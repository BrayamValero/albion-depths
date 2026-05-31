"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { formatSilver, formatFame } from "@/lib/format";
import { TierBadge } from "./TierBadge";
import { Pagination } from "./Pagination";
import { LoadingSpinner } from "./LoadingSpinner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const RENDER_BASE = "https://render.albiononline.com/v1/item";

function getItemIconUrl(type: string, quality?: number, size = 48) {
  return `${RENDER_BASE}/${type}.png?size=${size}${quality && quality > 1 ? `&quality=${quality}` : ""}`;
}

interface PlayerInfo {
  id: string;
  name: string;
  tier: string;
}

export interface TimelineEntry {
  id: number;
  killId: number;
  role: "KILL" | "DEATH" | "ASSIST";
  playerName: string;
  playerId: string;
  killer: PlayerInfo;
  victim: PlayerInfo;
  mmrChange: number;
  killTime: Date | string;
  totalFame?: number | null;
  lootSilverValue?: number | null;
  killerWeapon?: string | null;
  victimWeapon?: string | null;
  killerIp: number;
  victimIp: number;
  killerHead?: string | null;
  killerHeadQuality?: number | null;
  victimHead?: string | null;
  victimHeadQuality?: number | null;
}

interface Props {
  playerId: string;
  playerName: string;
}

type FilterKey = "KILL" | "DEATH" | "ASSIST";

const FILTERS = [
  {
    key: "KILL" as FilterKey,
    label: "Kills",
    activeClass: "bg-green-900/50 text-green-400 border-green-700",
    inactiveClass: "bg-surface border-border text-text-muted",
  },
  {
    key: "DEATH" as FilterKey,
    label: "Deaths",
    activeClass: "bg-red-900/50 text-red-400 border-red-700",
    inactiveClass: "bg-surface border-border text-text-muted",
  },
  {
    key: "ASSIST" as FilterKey,
    label: "Assists",
    activeClass: "bg-blue-900/50 text-blue-400 border-blue-700",
    inactiveClass: "bg-surface border-border text-text-muted",
  },
];

const ROLE_BADGE: Record<FilterKey, string> = {
  KILL: "bg-green-900/70 text-green-400",
  DEATH: "bg-red-900/70 text-red-400",
  ASSIST: "bg-blue-900/70 text-blue-400",
};

const CrossedSwords = () => (
  <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
    <svg
      viewBox="0 0 24 24"
      className="w-8 h-8 text-text-muted/50"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <g transform="rotate(45 12 12)">
        <path
          d="M12 3v13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M9 14h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 16v3"
          stroke="#bfa15f"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="20" r="0.75" fill="#bfa15f" />
      </g>
      <g transform="rotate(-45 12 12)">
        <path
          d="M12 3v13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M9 14h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 16v3"
          stroke="#bfa15f"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="20" r="0.75" fill="#bfa15f" />
      </g>
    </svg>
    <span className="absolute text-[7px] font-extrabold tracking-wider bg-[#0a0707] border border-border/80 rounded px-1 py-0.5 text-text-secondary select-none shadow-md">
      VS
    </span>
  </div>
);

function PlayerAvatar({
  name,
  headType,
  headQuality,
  weaponType,
}: {
  name: string;
  headType?: string | null;
  headQuality?: number | null;
  weaponType?: string | null;
}) {
  const url = headType
    ? getItemIconUrl(headType, headQuality ?? undefined, 64)
    : weaponType
      ? getItemIconUrl(weaponType, 1, 64)
      : null;

  return (
    <div className="w-10 h-10 rounded-lg bg-surface border border-border/80 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
      {url ? (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-contain scale-110"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="text-text-muted text-xs font-bold uppercase">
          {name.slice(0, 2)}
        </span>
      )}
    </div>
  );
}

export function ActivityTimeline({ playerId, playerName }: Props) {
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([
    "KILL",
    "DEATH",
    "ASSIST",
  ]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const skip = (page - 1) * perPage;

  const filterParam =
    activeFilters.length < 3 ? `&filter=${activeFilters.join(',')}` : '';

  const { data, error, isLoading } = useSWR<{
    data: TimelineEntry[];
    total: number;
  }>(
    `/api/player/${playerId}/activity?skip=${skip}&take=${perPage}${filterParam}`,
    fetcher,
  );

  const toggle = (key: FilterKey) => {
    if (activeFilters.includes(key)) {
      if (activeFilters.length > 1)
        setActiveFilters(activeFilters.filter((f) => f !== key));
    } else {
      setActiveFilters([...activeFilters, key]);
    }
    setPage(1);
  };

  const filterSet = new Set<FilterKey>(activeFilters);
  const timeline = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      {/* Header + filter toggles */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-extrabold gothic-title text-text-primary">
          Recent Activity
        </h2>
        <div className="flex gap-1.5 ml-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => toggle(f.key)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filterSet.has(f.key) ? f.activeClass : f.inactiveClass
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingSpinner message="Loading activity..." />}

      {error && (
        <div className="text-text-muted card text-center py-8">
          Failed to load activity
        </div>
      )}

      {!isLoading && !error && timeline.length > 0 && (
        <div className="space-y-3">
          {timeline.map((entry) => {
            const isAssist = entry.role === "ASSIST";

            return (
              <Link
                key={`${entry.role}-${entry.killId}`}
                href={`/kill/${entry.killId}`}
                className="card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 relative border border-border/40 hover:border-accent/30 overflow-hidden group"
                style={{ contentVisibility: "auto" }}
              >
                {/* Role badge */}
                <span
                  className={`absolute top-0 left-4 text-[9px] tracking-wider px-2 py-0.5 rounded-b font-extrabold uppercase border-x border-b border-white/10 shadow-md z-20 select-none ${ROLE_BADGE[entry.role]}`}
                >
                  {entry.role}
                </span>

                {/* Combatants */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-grow min-w-0 mt-1">
                  {/* Killer */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <PlayerAvatar
                      name={entry.killer.name}
                      headType={entry.killerHead}
                      headQuality={
                        entry.killerHead
                          ? (entry.killerHeadQuality ?? undefined)
                          : undefined
                      }
                      weaponType={entry.killerWeapon}
                    />
                    <div className="min-w-0">
                      {entry.killer.id === entry.playerId ? (
                        <span className="font-bold text-sm text-text-primary truncate block">
                          {entry.killer.name}
                        </span>
                      ) : (
                        <Link
                          href={`/player/${entry.killer.id}`}
                          className="font-bold text-sm text-text-primary hover:text-accent transition-colors truncate block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.killer.name}
                        </Link>
                      )}
                      <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                        <TierBadge tier={entry.killer.tier as any} size="sm" />
                        {entry.killerIp ? (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border/80"></span>
                            <span className="text-text-secondary/80 font-medium">
                              {entry.killerIp} IP
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <CrossedSwords />

                  {/* Victim */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <PlayerAvatar
                      name={entry.victim.name}
                      headType={entry.victimHead}
                      headQuality={
                        entry.victimHead
                          ? (entry.victimHeadQuality ?? undefined)
                          : undefined
                      }
                      weaponType={entry.victimWeapon}
                    />
                    <div className="min-w-0">
                      {entry.victim.id === entry.playerId ? (
                        <span className="font-bold text-sm text-text-primary truncate block">
                          {entry.victim.name}
                        </span>
                      ) : (
                        <Link
                          href={`/player/${entry.victim.id}`}
                          className="font-bold text-sm text-text-primary hover:text-accent transition-colors truncate block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.victim.name}
                        </Link>
                      )}
                      <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                        <TierBadge tier={entry.victim.tier as any} size="sm" />
                        {entry.victimIp ? (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border/80"></span>
                            <span className="text-text-secondary/80 font-medium">
                              {entry.victimIp} IP
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {isAssist && (
                    <span className="text-xs text-blue-400 font-medium italic shrink-0">
                      via {entry.playerName}
                    </span>
                  )}
                </div>

                {/* Right: MMR / Fame / Silver / Time */}
                <div className="flex flex-col items-start sm:items-end justify-center flex-shrink-0 text-left sm:text-right border-t border-border/20 sm:border-t-0 pt-2 sm:pt-0 sm:pl-4 min-w-[120px] gap-0.5 -mx-4 sm:mx-0 px-4 sm:px-0">
                  <span
                    className={`text-base font-extrabold tracking-tight ${entry.mmrChange >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {entry.mmrChange >= 0 ? "+" : ""}
                    {entry.mmrChange} MMR
                  </span>
                  <span className="text-xs text-accent/90 font-medium">
                    {formatFame(entry.totalFame) ?? "No"} fame
                  </span>
                  <span className="text-xs text-yellow-500/90 font-medium">
                    {formatSilver(entry.lootSilverValue) ?? "No"} silver
                  </span>
                  <span className="text-xs text-text-muted mt-0.5 select-none">
                    {formatDistanceToNow(new Date(entry.killTime), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!isLoading && !error && timeline.length === 0 && (
        <div className="text-text-muted card text-center py-8">
          No activity recorded yet
        </div>
      )}

      {!isLoading && !error && timeline.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(p) => {
            setPerPage(p);
            setPage(1);
          }}
          showPerPageSelector
        />
      )}
    </div>
  );
}
