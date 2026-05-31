'use client'

const RENDER_BASE = 'https://render.albiononline.com/v1/item'

export function WeaponIcon({ type, size = 24 }: { type?: string | null; size?: number }) {
  if (!type) return null
  return (
    <img
      src={`${RENDER_BASE}/${type}.png?size=${size}`}
      alt={type}
      className="inline-block align-middle"
      style={{ width: size, height: size }}
      loading="lazy"
      decoding="async"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
