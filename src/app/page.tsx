import { KillFeed } from '@/components/KillFeed'

export const metadata = {
  title: 'Albion Depths Killboard - Live Kills',
  description: 'Track recent kills in The Depths',
}

export default function HomePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Recent Kills</h1>
        <p className="text-text-muted mt-1">Live feed of kills in The Depths</p>
      </div>
      <KillFeed limit={50} />
    </div>
  )
}