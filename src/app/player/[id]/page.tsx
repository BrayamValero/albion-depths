import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'
import { TierBadge } from '@/components/TierBadge'
import { ActivityTimeline } from '@/components/ActivityTimeline'
import { RivalsSection } from '@/components/RivalsSection'

export const metadata = {
  title: 'Player Profile - Albion Depths Killboard',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params

  const player = await prisma.player.findUnique({
    where: { id },
  })

  if (!player) {
    notFound()
  }

  const tier = getTier(player.mmr)
  const rank = await prisma.player.count({ where: { mmr: { gt: player.mmr } } })
  const totalScore = player.kills + player.assists
  const kd = player.deaths > 0 ? Number((totalScore / player.deaths).toFixed(2)) : totalScore

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight gothic-title text-text-primary">{player.name}</h1>
            <p className="text-text-muted mt-1">Player Profile</p>
          </div>
          <div className="flex items-center gap-3">
            <TierBadge tier={tier} size="lg" />
            <span className="text-text-muted text-sm">#{rank + 1}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <div className="text-text-muted text-sm">MMR</div>
            <div className="text-2xl font-bold">{player.mmr}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">K+A/D</div>
            <div className="text-2xl font-bold">{kd}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">Kills</div>
            <div className="text-2xl font-bold text-green-500">{player.kills}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">Assists</div>
            <div className="text-2xl font-bold text-blue-400">{player.assists}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">Deaths</div>
            <div className="text-2xl font-bold text-red-500">{player.deaths}</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border -mx-5 px-5">
          <div className="text-text-muted text-sm">Current Win Streak</div>
          <div className="text-xl font-semibold">
            {player.streak > 0 ? `${player.streak} wins` : 'No active streak'}
          </div>
        </div>
      </div>

      <ActivityTimeline playerId={player.id} playerName={player.name} />
      <RivalsSection playerId={player.id} playerName={player.name} />
    </div>
  )
}
