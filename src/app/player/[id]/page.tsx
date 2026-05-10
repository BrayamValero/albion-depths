import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getTier } from '@/lib/mmr'
import { formatDistanceToNow } from 'date-fns'
import { TierBadge } from '@/components/TierBadge'

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

  const [recentKills, recentDeaths] = await Promise.all([
    prisma.kill.findMany({
      where: { killerId: id },
      orderBy: { killTime: 'desc' },
      take: 10,
      include: {
        victim: { select: { id: true, name: true, mmr: true } },
      },
    }),
    prisma.kill.findMany({
      where: { victimId: id },
      orderBy: { killTime: 'desc' },
      take: 10,
      include: {
        killer: { select: { id: true, name: true, mmr: true } },
      },
    }),
  ])

  const tier = getTier(player.mmr)
  const kd = player.deaths > 0 ? Number((player.kills / player.deaths).toFixed(2)) : player.kills

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{player.name}</h1>
            <p className="text-text-muted mt-1">Player Profile</p>
          </div>
          <TierBadge tier={tier} size="lg" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-text-muted text-sm">MMR</div>
            <div className="text-2xl font-bold">{player.mmr}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">K/D</div>
            <div className="text-2xl font-bold">{kd}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">Kills</div>
            <div className="text-2xl font-bold text-green-500">{player.kills}</div>
          </div>
          <div>
            <div className="text-text-muted text-sm">Deaths</div>
            <div className="text-2xl font-bold text-red-500">{player.deaths}</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-text-muted text-sm">Current Win Streak</div>
          <div className="text-xl font-semibold">
            {player.streak > 0 ? `${player.streak} wins` : 'No active streak'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Kills</h2>
          {recentKills.length > 0 ? (
            <div className="space-y-2">
              {recentKills.map((kill) => (
                <div key={kill.id} className="card card-hover flex items-center justify-between">
                  <Link
                    href={`/player/${kill.victim.id}`}
                    className="text-text-secondary hover:text-accent"
                  >
                    {kill.victim.name}
                  </Link>
                  <div className="text-right">
                    <span className="text-green-500">+{kill.mmrChange} MMR</span>
                    <div className="text-text-muted text-xs">
                      {formatDistanceToNow(new Date(kill.killTime), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-muted">No kills recorded yet</div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Deaths</h2>
          {recentDeaths.length > 0 ? (
            <div className="space-y-2">
              {recentDeaths.map((death) => (
                <div key={death.id} className="card card-hover flex items-center justify-between">
                  <Link
                    href={`/player/${death.killer.id}`}
                    className="text-text-secondary hover:text-accent"
                  >
                    {death.killer.name}
                  </Link>
                  <div className="text-right">
                    <span className="text-red-500">{death.mmrChange} MMR</span>
                    <div className="text-text-muted text-xs">
                      {formatDistanceToNow(new Date(death.killTime), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-muted">No deaths recorded yet</div>
          )}
        </div>
      </div>
    </div>
  )
}