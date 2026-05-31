import type { Metadata } from 'next'
import { Cinzel, Cinzel_Decorative, Outfit, Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
})

const cinzelDecorative = Cinzel_Decorative({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel-decorative',
})

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
    <html lang="en" className={`${outfit.variable} ${inter.variable} ${cinzel.variable} ${cinzelDecorative.variable}`}>
      <head>
        <link rel="preconnect" href="https://render.albiononline.com" />
      </head>
      <body className="min-h-screen flex flex-col">
        <ServiceWorkerRegister />
        <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/40 backdrop-blur-md">
          <nav className="container-custom flex items-center justify-between h-20">
            {/* Left Navigation */}
            <div className="flex items-center justify-end gap-5 flex-1 text-sm pr-8">
              <Link href="/feed" className="whitespace-nowrap text-text-secondary hover:text-text-primary transition-colors hover:underline decoration-accent decoration-2 underline-offset-8">
                Recent Kills
              </Link>
              <Link href="/rankings" className="whitespace-nowrap text-text-secondary hover:text-text-primary transition-colors hover:underline decoration-accent decoration-2 underline-offset-8">
                Rankings
              </Link>
            </div>

            {/* Center Logo */}
            <div className="flex justify-center shrink-0">
              <Link href="/" className="group cursor-pointer">
                <div className="flex flex-col items-center select-none py-1 relative">
                  {/* Sword SVG Background */}
                  <div className="absolute -top-1 left-1/2 -translate-x-[48%] h-20 w-8 pointer-events-none opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300">
                    <svg viewBox="0 0 100 240" className="w-full h-full">
                      {/* Blade */}
                      <path d="M 47 30 L 53 30 L 52 175 L 50 185 L 48 175 Z" fill="url(#bladeGradient)" stroke="#8c8c8c" strokeWidth="1" />
                      {/* Blade fuller */}
                      <line x1="50" y1="35" x2="50" y2="170" stroke="#3a3a3a" strokeWidth="1" />
                      {/* Crossguard */}
                      <path d="M 32 175 C 42 173, 58 173, 68 175 C 68 180, 58 178, 50 178 C 42 178, 32 180, 32 175 Z" fill="#d4af37" stroke="#aa840c" strokeWidth="1.5" />
                      {/* Ruby Gem */}
                      <circle cx="50" cy="176.5" r="2" fill="#ff4d5a" />
                      {/* Grip */}
                      <rect x="47.5" y="178" width="5" height="25" rx="1.5" fill="#3a2512" stroke="#251608" strokeWidth="1" />
                      {/* Pommel */}
                      <circle cx="50" cy="207.5" r="4.5" fill="#d4af37" stroke="#aa840c" strokeWidth="1.5" />
                      
                      <defs>
                        <linearGradient id="bladeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#e5e5e5" />
                          <stop offset="50%" stopColor="#ffffff" />
                          <stop offset="100%" stopColor="#cccccc" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-red-500 to-red-700 gothic-title tracking-wider relative drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)] z-10 group-hover:from-orange-300 group-hover:via-red-400 group-hover:to-red-600 transition-all duration-300">
                    Albion
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-[0.45em] text-yellow-500/80 -mt-1.5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] z-10 pl-[0.45em]">
                    Depths
                  </div>
                </div>
              </Link>
            </div>
            
            {/* Right Navigation */}
            <div className="flex items-center justify-start gap-5 flex-1 text-sm pl-8">
              <Link href="/h2h" className="whitespace-nowrap text-text-secondary hover:text-text-primary transition-colors hover:underline decoration-accent decoration-2 underline-offset-8">
                Head-to-Head
              </Link>
              <Link href="/weapons" className="whitespace-nowrap text-text-secondary hover:text-text-primary transition-colors hover:underline decoration-accent decoration-2 underline-offset-8">
                Weapons
              </Link>
              <Link href="/calculator" className="whitespace-nowrap text-text-secondary hover:text-text-primary transition-colors hover:underline decoration-accent decoration-2 underline-offset-8">
                Calculator
              </Link>
            </div>
          </nav>
        </header>
        <main className="container-custom py-8 flex-grow">
          {children}
        </main>
        <footer className="border-t border-border/20 bg-background/20 backdrop-blur-sm mt-auto">
          <div className="container-custom py-6 text-center text-text-muted text-xs">
            Albion Depths Killboard &bull; Not affiliated with Sandbox Interactive
          </div>
        </footer>
      </body>
    </html>
  )
}