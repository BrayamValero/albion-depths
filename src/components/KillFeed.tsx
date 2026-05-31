"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { formatFame, formatSilver } from "@/lib/format";
import { TierBadge } from "./TierBadge";
import { Pagination } from "./Pagination";
import type { KillEvent } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const RENDER_BASE = "https://render.albiononline.com/v1/item";

function getItemIconUrl(type: string, quality?: number, size = 48) {
  return `${RENDER_BASE}/${type}.png?size=${size}${quality && quality > 1 ? `&quality=${quality}` : ""}`;
}

const CrossedSwords = () => (
  <div className="relative w-12 h-12 flex items-center justify-center">
    <svg
      viewBox="0 0 24 24"
      className="w-10 h-10 text-text-muted/60 transition-transform group-hover:rotate-12 duration-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {/* Sword 1 */}
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
      {/* Sword 2 */}
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
    <span className="absolute text-[8px] font-extrabold tracking-wider bg-[#0a0707] border border-border/80 rounded px-1.5 py-0.5 text-text-secondary select-none shadow-lg">
      VS
    </span>
  </div>
);

interface KillFeedProps {
  limit?: number;
}

export function KillFeed({ limit: defaultLimit = 10 }: KillFeedProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const skip = (page - 1) * perPage;

  const { data, error, isLoading } = useSWR<{
    data: KillEvent[];
    total: number;
  }>(
    `/api/feed?limit=${perPage}&skip=${skip}`,
    fetcher,
    { refreshInterval: 15000 }, // Auto refresh every 15s for the live feel
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
        <div className="text-text-muted text-sm font-medium tracking-wide">
          Loading live kill feed...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 card border-red-500/20 bg-red-950/5 text-red-400 font-medium">
        Failed to load live kill feed. Please check back shortly.
      </div>
    );
  }

  if (!data?.data?.length) {
    return (
      <div className="text-center py-12 card text-text-muted font-medium">
        No kills recorded yet. Waiting for the sync worker...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.data.map((kill) => {
        const killerAvatarUrl = kill.killerWeapon
          ? getItemIconUrl(kill.killerWeapon, 1, 64)
          : null;

        const victimAvatarUrl = kill.victimWeapon
          ? getItemIconUrl(kill.victimWeapon, 1, 64)
          : null;

        return (
          <Link
            key={kill.id}
            href={`/kill/${kill.id}`}
            className="card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 relative border border-border/40 hover:border-accent/30 overflow-hidden group"
            style={{ contentVisibility: "auto" }}
          >
            <span className="absolute top-0 left-4 text-[9px] tracking-wider px-2 py-0.5 rounded-b bg-green-900/70 text-green-400 font-extrabold uppercase border-x border-b border-green-700/50 shadow-md z-20 select-none">
              KILL
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-grow min-w-0 mt-1">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface border border-border/80 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                  {killerAvatarUrl ? (
                    <img
                      src={killerAvatarUrl}
                      alt={kill.killer.name}
                      className="w-full h-full object-contain scale-110"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-text-muted text-xs font-bold uppercase">
                      {kill.killer.name.slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/player/${kill.killer.id}`}
                    className="font-bold text-sm text-text-primary hover:text-accent transition-colors truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {kill.killer.name}
                  </Link>
                  <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                    <TierBadge tier={kill.killer.tier as any} size="sm" />
                    {kill.killerIp ? (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border/80"></span>
                        <span className="text-text-secondary/80 font-medium">
                          {kill.killerIp} IP
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <CrossedSwords />

              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface border border-border/80 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                  {victimAvatarUrl ? (
                    <img
                      src={victimAvatarUrl}
                      alt={kill.victim.name}
                      className="w-full h-full object-contain scale-110"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-text-muted text-xs font-bold uppercase">
                      {kill.victim.name.slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/player/${kill.victim.id}`}
                    className="font-bold text-sm text-text-primary hover:text-accent transition-colors truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {kill.victim.name}
                  </Link>
                  <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                    <TierBadge tier={kill.victim.tier as any} size="sm" />
                    {kill.victimIp ? (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border/80"></span>
                        <span className="text-text-secondary/80 font-medium">
                          {kill.victimIp} IP
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end justify-center flex-shrink-0 text-left sm:text-right border-t border-border/20 sm:border-t-0 pt-2 sm:pt-0 sm:pl-4 min-w-[120px] gap-0.5 -mx-4 sm:mx-0 px-4 sm:px-0">
              <span
                className={`text-base font-extrabold tracking-tight ${kill.mmrChange >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {kill.mmrChange >= 0 ? "+" : ""}
                {kill.mmrChange} MMR
              </span>
              <span className="text-xs text-accent/90 font-medium">
                {formatFame(kill.totalFame ?? kill.fame) ?? "No"} fame
              </span>
              <span className="text-xs text-yellow-500/90 font-medium">
                {formatSilver(kill.lootSilverValue) ?? "No"} silver
              </span>
              <span className="text-xs text-text-muted mt-0.5 select-none">
                {formatDistanceToNow(new Date(kill.killTime), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </Link>
        );
      })}
      <Pagination
        currentPage={page}
        totalPages={Math.ceil((data.total ?? 0) / perPage)}
        perPage={perPage}
        onPageChange={(p) => setPage(p)}
        onPerPageChange={(p) => {
          setPerPage(p);
          setPage(1);
        }}
        showPerPageSelector
      />
    </div>
  );
}
