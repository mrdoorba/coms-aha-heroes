import { Star, AlertTriangle, Award } from 'lucide-react'
import { cn } from '~/lib/utils'
import type { PointCategoryCode } from '~/shared/constants'

const categoryConfig: Record<
  PointCategoryCode,
  { icon: typeof Star; color: string; bg: string }
> = {
  BINTANG: { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  PENALTI: { icon: AlertTriangle, color: 'text-purple-500', bg: 'bg-purple-50' },
  POIN_AHA: { icon: Award, color: 'text-blue-500', bg: 'bg-blue-50' },
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
        'flex items-center justify-center rounded-xl',
        sizeClasses[size],
        config.bg,
        className,
      )}
    >
      <Icon className={cn(iconSizes[size], config.color)} />
    </div>
  )
}
