import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Albion Depths Killboard',
  description: 'Track your MMR and compete in The Depths',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-border bg-surface">
          <nav className="container-custom flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-accent">
              Albion Depths
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/rankings" className="text-text-secondary hover:text-text-primary transition-colors">
                Rankings
              </Link>
              <Link href="/search" className="text-text-secondary hover:text-text-primary transition-colors">
                Search
              </Link>
              <Link href="/h2h" className="text-text-secondary hover:text-text-primary transition-colors">
                Head-to-Head
              </Link>
              <Link href="/admin" className="text-text-muted hover:text-text-secondary transition-colors text-sm">
                Admin
              </Link>
            </div>
          </nav>
        </header>
        <main className="container-custom py-8">
          {children}
        </main>
        <footer className="border-t border-border mt-auto">
          <div className="container-custom py-6 text-center text-text-muted text-sm">
            Albion Depths Killboard - Not affiliated with Sandbox Interactive
          </div>
        </footer>
      </body>
    </html>
  )
}