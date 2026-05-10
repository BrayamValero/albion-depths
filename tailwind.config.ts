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
          crystal: '#b9f2ff',
        },
      },
    },
  },
  plugins: [],
}
export default config