import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#1a1a1a',
        surfaceHover: '#252525',
        border: '#2a2a2a',
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          muted: '#666666',
        },
        accent: '#e63946',
        tier: {
          iron: '#8b8b8b',
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          gold: '#ffd700',
          platinum: '#e5e4e2',
          emerald: '#50c878',
          crystal: '#b9f2ff',
        },
      },
    },
  },
  safelist: [
    'bg-tier-iron',
    'bg-tier-bronze',
    'bg-tier-silver',
    'bg-tier-gold',
    'bg-tier-platinum',
    'bg-tier-emerald',
    'bg-tier-crystal',
  ],
  plugins: [],
}
export default config