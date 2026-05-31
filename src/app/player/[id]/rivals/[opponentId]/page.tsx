import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'
import { RivalDetailClient } from '@/components/RivalDetailClient'

interface Props {
  params: Promise<{ id: string; opponentId: string }>
}

export default async function RivalDetailPage({ params }: Props) {
  const { id, opponentId } = await params

  const [player, opponent] = await Promise.all([
    prisma.player.findUnique({ where: { id } }),
    prisma.player.findUnique({ where: { id: opponentId } }),
  ])

  if (!player || !opponent) notFound()

  const kills = await prisma.kill.findMany({
    where: {
      OR: [
        { killerId: id, victimId: opponentId },
        { killerId: opponentId, victimId: id },
      ],
    },
    orderBy: { killTime: 'desc' },
  })

  const killsByPlayer = kills.filter((k) => k.killerId === id)
  const killsByOpponent = kills.filter((k) => k.killerId === opponentId)

  const playerTier = getTier(player.mmr)
  const opponentTier = getTier(opponent.mmr)

  const mapKill = (k: typeof kills[0], isPlayer: boolean) => ({
    id: k.id,
    killTime: k.killTime.toISOString(),
    totalFame: k.totalFame ?? k.fame,
    fame: k.fame,
    mmrChange: k.mmrChange,
    killerWeapon: k.killerWeapon,
    victimWeapon: k.victimWeapon,
    killerIp: Math.round(k.killerIp ?? 0),
    victimIp: Math.round(k.victimIp ?? 0),
    killer: { id: k.killerId, name: isPlayer ? player.name : opponent.name, tier: isPlayer ? playerTier : opponentTier },
    victim: { id: k.victimId, name: isPlayer ? opponent.name : player.name, tier: isPlayer ? opponentTier : playerTier },
    lootSilverValue: k.lootSilverValue,
  })

  return (
    <RivalDetailClient
      playerId={player.id}
      playerName={player.name}
      opponentName={opponent.name}
      killsByPlayer={killsByPlayer.map((k) => mapKill(k, true))}
      killsByOpponent={killsByOpponent.map((k) => mapKill(k, false))}
      backHref={`/player/${id}`}
      total={kills.length}
    />
  )
}
