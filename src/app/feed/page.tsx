import { KillFeed } from '@/components/KillFeed'

export const metadata = {
  title: 'Recent Kills - Albion Depths Killboard',
  description: 'Live feed of recent kills in The Depths',
}

export default function FeedPage() {
  return (
    <div className="max-w-4xl mx-auto relative pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight gothic-title text-text-primary">Recent Kills</h1>
        <p className="text-text-muted text-sm mt-1.5 font-medium">Live feed of kills in The Depths</p>
      </div>

      <KillFeed limit={50} />

      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141111]/90 border border-border/80 text-xs font-semibold text-text-secondary shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md select-none transition-all duration-300 hover:border-accent/30">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
        <span>Live update</span>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-text-muted hover:text-text-secondary cursor-help transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Feed updates automatically as new kills occur">
          <title>Feed updates automatically as new kills occur</title>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </div>
    </div>
  )
}
