'use client'

const RENDER_BASE = 'https://render.albiononline.com/v1/item'

export function ItemIcon({ type, size = 48, quality }: { type?: string | null; size?: number; quality?: number }) {
  if (!type) return null
  return (
    <img
      src={`${RENDER_BASE}/${type}.png?size=${size}${quality && quality > 1 ? `&quality=${quality}` : ''}`}
      alt={type}
      className="inline-block"
      style={{ width: size, height: size }}
      loading="lazy"
      decoding="async"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
