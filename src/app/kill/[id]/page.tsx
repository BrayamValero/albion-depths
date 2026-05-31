import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTier } from "@/lib/mmr";
import { TierBadge } from "@/components/TierBadge";
import { ItemIcon } from "@/components/ItemIcon";
import { formatSilver, formatFame } from "@/lib/format";
import { getPrices, calcValue, allEquipItems } from "@/lib/pricing";

const EQUIP_LABELS: Record<string, string> = {
  MainHand: "Weapon",
  OffHand: "Offhand",
  Head: "Head",
  Armor: "Chest",
  Shoes: "Boots",
  Bag: "Bag",
  Cape: "Cape",
  Mount: "Mount",
  Potion: "Potion",
  Food: "Food",
};

const EQUIP_ORDER = [
  "MainHand",
  "OffHand",
  "Head",
  "Armor",
  "Shoes",
  "Bag",
  "Cape",
  "Mount",
  "Potion",
  "Food",
];

const EQUIP_ROWS: string[][] = [
  ["Bag", "Head", "Cape"],
  ["MainHand", "Armor", "OffHand"],
  ["Potion", "Shoes", "Food"],
];

const DAMAGE_COLORS = [
  "#ff4d5a",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
];

const HEALING_COLORS = [
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#10b981",
  "#34d399",
  "#2dd4bf",
  "#22d3ee",
  "#4ade80",
  "#2ecc71",
  "#1abc9c",
];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function KillPage({ params }: Props) {
  const { id } = await params;

  const kill = await prisma.kill.findUnique({
    where: { id: parseInt(id) },
    include: {
      killer: { select: { id: true, name: true, mmr: true } },
      victim: { select: { id: true, name: true, mmr: true } },
      participants: {
        include: {
          player: { select: { id: true, name: true, mmr: true } },
        },
      },
      equipment: true,
      inventory: true,
    },
  });

  if (!kill) notFound();

  const equipByOwner = new Map<
    string,
    Record<string, { Type: string; Count: number; Quality: number } | null>
  >();
  for (const eq of kill.equipment) {
    if (!equipByOwner.has(eq.owner)) equipByOwner.set(eq.owner, {});
    equipByOwner.get(eq.owner)![eq.slot] = {
      Type: eq.itemType,
      Count: eq.count,
      Quality: eq.quality,
    };
  }

  const buildEquipment = (ownerId: string) => equipByOwner.get(ownerId) ?? {};
  const killerEquip = buildEquipment(kill.killerId);
  const victimEquip = buildEquipment(kill.victimId);

  const victimInventory = kill.inventory.map((i) => ({
    Type: i.itemType,
    Count: i.count,
    Quality: i.quality,
  }));

  const priceItems = [
    ...victimInventory.map((i) => ({ Type: i.Type, Quality: i.Quality })),
    ...allEquipItems(killerEquip),
    ...allEquipItems(victimEquip),
  ];
  const priceMap = await getPrices(priceItems);

  const lootSilverValue = kill.lootSilverValue ?? (() => {
    const v = Math.round(calcValue(victimInventory, priceMap));
    return v > 0 ? v : null;
  })();

  const killerGearValue = Math.round(
    calcValue(
      allEquipItems(killerEquip).map((e) => ({ ...e, Count: 1 })),
      priceMap,
    ),
  );
  const victimGearValue = Math.round(
    calcValue(
      allEquipItems(victimEquip).map((e) => ({ ...e, Count: 1 })),
      priceMap,
    ),
  );

  const killerParticipant = kill.participants.find((p) => p.role === "KILLER");
  const victimParticipant = kill.participants.find((p) => p.role === "VICTIM");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <span className="absolute top-0 left-4 text-[9px] tracking-wider px-2 py-0.5 rounded-b bg-green-900/70 text-green-400 font-extrabold uppercase border-x border-b border-green-700/50 shadow-md z-20 select-none">
          KILL
        </span>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <ItemIcon type={kill.killerWeapon} size={48} />
            <div className="flex flex-col gap-2">
              <Link
                href={`/player/${kill.killer.id}`}
                className="font-bold hover:underline "
              >
                {kill.killer.name}
              </Link>
              <div className="flex items-center gap-2">
                {/* Tier */}
                {(() => {
                  const tier = getTier(kill.killer.mmr);
                  return <TierBadge tier={tier} size="sm" />;
                })()}
                <span className="w-1 h-1 rounded-full bg-border/80"></span>
                <span className="text-text-secondary/80 font-medium text-xs">
                  {Math.round(kill.killerIp ?? 0)} IP
                </span>
              </div>
              <div className="text-text-muted text-xs">
                {kill.killer.mmr} MMR{" "}
                <span className="text-green-500">
                  (
                  {killerParticipant && killerParticipant.mmrChange >= 0
                    ? "+"
                    : ""}
                  {killerParticipant?.mmrChange})
                </span>
              </div>
            </div>
          </div>
          <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-text-muted/50"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <g transform="rotate(45 12 12)">
                <path
                  d="M12 3v13"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                ></path>
                <path
                  d="M9 14h6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                ></path>
                <path
                  d="M12 16v3"
                  stroke="#bfa15f"
                  stroke-width="2"
                  stroke-linecap="round"
                ></path>
                <circle cx="12" cy="20" r="0.75" fill="#bfa15f"></circle>
              </g>
              <g transform="rotate(-45 12 12)">
                <path
                  d="M12 3v13"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                ></path>
                <path
                  d="M9 14h6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                ></path>
                <path
                  d="M12 16v3"
                  stroke="#bfa15f"
                  stroke-width="2"
                  stroke-linecap="round"
                ></path>
                <circle cx="12" cy="20" r="0.75" fill="#bfa15f"></circle>
              </g>
            </svg>
            <span className="absolute text-[7px] font-extrabold tracking-wider bg-[#0a0707] border border-border/80 rounded px-1 py-0.5 text-text-secondary select-none shadow-md">
              VS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ItemIcon type={kill.victimWeapon} size={48} />
            <div className="flex flex-col gap-2">
              <Link
                href={`/player/${kill.victim.id}`}
                className="font-bold hover:underline "
              >
                {kill.victim.name}
              </Link>

              <div className="flex items-center gap-2">
                {(() => {
                  const tier = getTier(kill.victim.mmr);
                  return <TierBadge tier={tier} size="sm" />;
                })()}
                <span className="w-1 h-1 rounded-full bg-border/80"></span>
                <span className="text-text-secondary/80 font-medium text-xs">
                  {Math.round(kill.victimIp ?? 0)} IP
                </span>

                {victimParticipant && victimParticipant.damageDone > 0 && (
                  <div className="text-xs text-text-muted">
                    {victimParticipant.damageDone.toLocaleString()} dmg
                  </div>
                )}
              </div>
              <span className="text-text-muted text-xs">
                {kill.victim.mmr} MMR{" "}
                <span className="text-red-500">
                  (
                  {victimParticipant && victimParticipant.mmrChange >= 0
                    ? "+"
                    : ""}
                  {victimParticipant?.mmrChange})
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-text-muted mt-4 pt-4 border-t border-border -mx-5 px-5">
          <div className="flex items-center gap-4">
            <div>
              {formatDistanceToNow(new Date(kill.killTime), {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-accent">
            {kill.killer.name}&apos;s Equipment
          </h3>
          <EquipmentGrid equip={killerEquip} />
          {formatSilver(killerGearValue) && (
            <div className="mt-3 text-xs text-text-muted text-right">
              Gear value:{" "}
              <span className="text-yellow-500">
                {formatSilver(killerGearValue)}
              </span>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-red-400">
            {kill.victim.name}&apos;s Equipment
          </h3>
          <EquipmentGrid equip={victimEquip} />
          {formatSilver(victimGearValue) && (
            <div className="mt-3 text-xs text-text-muted text-right">
              Gear value:{" "}
              <span className="text-yellow-500">
                {formatSilver(victimGearValue)}
              </span>
            </div>
          )}
        </div>
      </div>

      {victimInventory.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Loot Dropped</h3>
            <div className="flex items-center gap-3">
              <span className="text-yellow-500 font-medium">
                {victimInventory.length} items
              </span>
            </div>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {victimInventory.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="bg-surface border border-border rounded-lg p-1 relative">
                  <ItemIcon type={item.Type} size={36} quality={item.Quality} />
                  {item.Count > 1 && (
                    <span className="absolute -bottom-1 -right-1 text-xs bg-surfaceHover rounded px-0.5">
                      {item.Count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border text-xs text-text-muted flex justify-between -mx-5 px-5">
            <span>Fame: {formatFame(kill.totalFame ?? kill.fame) ?? 0}</span>
            {formatSilver(lootSilverValue) && (
              <span className="text-yellow-500">
                {formatSilver(lootSilverValue)}
              </span>
            )}
          </div>
        </div>
      )}

      {kill.participants.length > 1 && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Participants</h3>
            {kill.killerPartySize && kill.killerPartySize > 1 ? (
              <span className="text-text-muted text-xs">
                Party of {kill.killerPartySize} (Avg {kill.killerPartyMmr} MMR)
              </span>
            ) : null}
          </div>
          <div className="space-y-4">
            {kill.participants
              .filter((p) => p.role !== "VICTIM")
              .map((p) => {
                const pEquip = buildEquipment(p.player.id);
                return (
                  <div
                    key={p.player.id}
                    className="border-b border-border last:border-0 pb-4 last:pb-0 -mx-5 px-5"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/player/${p.player.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {p.player.name}
                      </Link>
                      {p.role === "KILLER" && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/50 text-green-400 font-medium">
                          KILLER
                        </span>
                      )}
                      {p.role === "ASSISTER" && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400 font-medium">
                          ASSIST
                        </span>
                      )}
                      {(() => {
                        const tier = getTier(p.player.mmr);
                        return <TierBadge tier={tier} size="sm" />;
                      })()}
                      <span className="w-1 h-1 rounded-full bg-border/80"></span>
                      <span className="text-text-secondary/80 font-medium text-xs">
                        {Math.round(p.ip ?? 0)} IP
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {EQUIP_ORDER.map((slot) => {
                          const item = pEquip[slot];
                          if (!item) return null;
                          return (
                            <div
                              key={slot}
                              className="flex flex-col items-center gap-0.5"
                            >
                              <div className="bg-surface border border-border rounded p-1">
                                <ItemIcon
                                  type={item.Type}
                                  size={28}
                                  quality={item.Quality}
                                />
                              </div>
                              <span className="text-[10px] text-text-muted leading-none">
                                {EQUIP_LABELS[slot]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <span
                        className={`text-xs font-medium tabular-nums ${p.mmrChange >= 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {p.mmrChange >= 0 ? "+" : ""}
                        {p.mmrChange} MMR
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {(() => {
        const nonVictims = kill.participants.filter((p) => p.role !== "VICTIM");
        const hasDamage = nonVictims.filter((p) => p.damageDone > 0).length > 1;
        const hasHealing =
          nonVictims.filter((p) => p.healingDone > 0).length > 1;
        if (!hasDamage && !hasHealing) return null;
        return (
          <div className="space-y-6">
            {hasDamage && (
              <ContributionBar
                title="Damage Contribution"
                participants={nonVictims.map((p) => ({
                  id: p.player.id,
                  name: p.player.name,
                  value: Math.round(p.damageDone),
                }))}
                unit="dmg"
                colors={DAMAGE_COLORS}
              />
            )}
            {hasHealing && (
              <ContributionBar
                title="Healing Contribution"
                participants={nonVictims.map((p) => ({
                  id: p.player.id,
                  name: p.player.name,
                  value: Math.round(p.healingDone),
                }))}
                unit="heal"
                colors={HEALING_COLORS}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
}

function EquipSlot({
  slot,
  item,
  fallback,
}: {
  slot: string;
  item: { Type: string; Count?: number; Quality?: number } | null | undefined;
  fallback?: { Type: string; Count?: number; Quality?: number } | null;
}) {
  const displayItem = item || fallback;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`bg-surface border rounded-lg p-2 ${displayItem ? "border-border" : "border-border/20 opacity-30"}`}
      >
        {displayItem ? (
          <ItemIcon
            type={displayItem.Type}
            size={40}
            quality={displayItem.Quality}
          />
        ) : (
          <div className="w-10 h-10" />
        )}
      </div>
      <span className="text-xs text-text-muted text-center leading-tight">
        {EQUIP_LABELS[slot]}
      </span>
    </div>
  );
}

function EquipmentGrid({
  equip,
}: {
  equip: Record<
    string,
    { Type: string; Count?: number; Quality?: number } | null
  >;
}) {
  return (
    <div className="space-y-3">
      {EQUIP_ROWS.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 gap-3">
          {row.map((slot) => (
            <EquipSlot
              key={slot}
              slot={slot}
              item={equip[slot]}
              fallback={
                slot === "OffHand" && !equip.OffHand
                  ? equip.MainHand
                  : undefined
              }
            />
          ))}
        </div>
      ))}
      <div className="flex justify-center">
        <EquipSlot slot="Mount" item={equip.Mount} />
      </div>
    </div>
  );
}

function ContributionBar({
  title,
  participants,
  unit,
  colors,
}: {
  title: string;
  participants: { id: string; name: string; value: number }[];
  unit: string;
  colors: string[];
}) {
  const total = participants.reduce((s, p) => s + p.value, 0);
  if (total <= 0) return null;
  const sorted = [...participants].sort((a, b) => b.value - a.value);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-5">{title}</h3>
      <div className="w-full h-3 rounded-full bg-surface overflow-hidden flex gap-[2px]">
        {sorted.map((p, i) => {
          const pct = (p.value / total) * 100;
          if (pct < 1) return null;
          return (
            <div
              key={p.id}
              className="h-full rounded-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${pct}%`,
                backgroundColor: colors[i % colors.length],
                minWidth: pct > 1 ? "4px" : "0px",
              }}
              title={`${p.name}: ${pct.toFixed(1)}% (${p.value.toLocaleString()} ${unit})`}
            />
          );
        })}
      </div>
      <div className="space-y-2.5 mt-5">
        {sorted.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 min-w-0">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-sm text-text-primary">{p.name}</span>
            <span className="text-xs text-text-muted tabular-nums ml-auto">
              {p.value.toLocaleString()} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
