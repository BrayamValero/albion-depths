import Link from 'next/link'
import { SearchBar } from '@/components/SearchBar'

export const metadata = {
  title: 'Albion Depths Killboard',
  description: 'Search for players in The Depths',
}

const links = [
  {
    href: '/feed',
    label: 'Recent Kills',
    desc: 'Live feed of the latest battles in The Depths',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    accent: 'text-red-400',
    border: 'hover:border-red-500/40',
    glow: 'group-hover:shadow-[0_0_25px_rgba(255,77,90,0.15)]',
  },
  {
    href: '/rankings',
    label: 'Rankings',
    desc: 'Top players ranked by MMR across all tiers',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    ),
    accent: 'text-yellow-500',
    border: 'hover:border-yellow-500/40',
    glow: 'group-hover:shadow-[0_0_25px_rgba(212,175,55,0.15)]',
  },
  {
    href: '/h2h',
    label: 'Head to Head',
    desc: 'Compare player performance in direct matchups',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    accent: 'text-blue-400',
    border: 'hover:border-blue-500/40',
    glow: 'group-hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]',
  },
  {
    href: '/weapons',
    label: 'Weapons',
    desc: 'Top players ranked by K/D for each weapon family',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 17.5L3 6l3-3 9 11.5M9 15l-6 6" />
        <path d="M17 12l-5 5M21 21l-4-4" />
      </svg>
    ),
    accent: 'text-purple-400',
    border: 'hover:border-purple-500/40',
    glow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]',
  },
  {
    href: '/admin',
    label: 'Admin',
    desc: 'Manage seasons, view stats, and control the killboard',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    accent: 'text-text-muted',
    border: 'hover:border-border/80',
    glow: 'group-hover:shadow-[0_0_25px_rgba(140,118,118,0.15)]',
  },
]

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col items-center justify-center pt-12 pb-16">
        <div className="mb-4">
          <h1 className="text-5xl font-extrabold tracking-tight gothic-title text-text-primary text-center">Albion Depths</h1>
          <p className="text-text-muted text-sm mt-2 text-center">Search for a player to view their stats</p>
        </div>
        <div className="w-full max-w-md">
          <SearchBar />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 pb-12">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`card card-hover group p-6 flex flex-col gap-4 transition-all duration-300 ${link.border} ${link.glow}`}
          >
            <div className={`${link.accent} transition-colors duration-300`}>
              {link.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary group-hover:text-white transition-colors">{link.label}</h2>
              <p className="text-sm text-text-muted mt-1 leading-relaxed">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
