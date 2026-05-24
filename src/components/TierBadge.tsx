import { Tier } from '@/lib/types'
import { clsx } from 'clsx'

interface TierBadgeProps {
  tier: Tier
  size?: 'sm' | 'md' | 'lg'
}

const tierStyles: Record<Tier, string> = {
  Iron: 'bg-tier-iron text-black',
  Bronze: 'bg-tier-bronze text-black',
  Silver: 'bg-tier-silver text-black',
  Gold: 'bg-tier-gold text-black',
  Platinum: 'bg-tier-platinum text-black',
  Emerald: 'bg-tier-emerald text-black',
  Crystal: 'bg-tier-crystal text-black',
}

const tierSizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center font-semibold rounded-md',
        tierStyles[tier],
        tierSizes[size]
      )}
    >
      {tier}
    </span>
  )
}