import { Star, AlertTriangle, Award } from 'lucide-react'
import { cn } from '~/lib/utils'
import type { PointCategoryCode } from '~/shared/constants'

const categoryConfig: Record<
  PointCategoryCode,
  { icon: typeof Star; color: string; bg: string; ring: string }
> = {
  BINTANG: {
    icon: Star,
    color: 'text-[#a07700]',
    bg: 'bg-gradient-to-br from-[#F4C144]/20 to-[#FFD97D]/30',
    ring: 'ring-1 ring-[#F4C144]/30',
  },
  PENALTI: {
    icon: AlertTriangle,
    color: 'text-[#C73E3E]',
    bg: 'bg-gradient-to-br from-[#C73E3E]/10 to-[#E06B6B]/15',
    ring: 'ring-1 ring-[#C73E3E]/20',
  },
  POIN_AHA: {
    icon: Award,
    color: 'text-[#325FEC]',
    bg: 'bg-gradient-to-br from-[#325FEC]/10 to-[#759EEE]/20',
    ring: 'ring-1 ring-[#325FEC]/20',
  },
}

type CategoryIconProps = {
  readonly code: PointCategoryCode
  readonly size?: 'sm' | 'md' | 'lg'
  readonly className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function CategoryIcon({ code, size = 'md', className }: CategoryIconProps) {
  const config = categoryConfig[code]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl shrink-0',
        sizeClasses[size],
        config.bg,
        config.ring,
        className,
      )}
    >
      <Icon className={cn(iconSizes[size], config.color)} />
    </div>
  )
}
