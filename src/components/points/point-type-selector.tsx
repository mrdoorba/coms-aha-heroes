import { Link } from '@tanstack/react-router'
import { Star, AlertTriangle, Award } from 'lucide-react'
import { cn } from '~/lib/utils'
import type { UserRole } from '~/shared/constants'
import * as m from '~/paraglide/messages'

type PointTypeSelectorProps = {
  readonly userRole: UserRole
  readonly className?: string
}

const pointTypeBases = [
  {
    code: 'bintang' as const,
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800/50',
    href: '/points/new/bintang' as const,
    roles: ['admin', 'hr', 'leader', 'employee'] as const,
  },
  {
    code: 'penalti' as const,
    icon: AlertTriangle,
    color: 'text-purple-500',
    bg: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800/50',
    href: '/points/new/penalti' as const,
    roles: ['admin', 'hr', 'leader'] as const,
  },
  {
    code: 'poin-aha' as const,
    icon: Award,
    color: 'text-blue-500',
    bg: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800/50',
    href: '/points/new/poin-aha' as const,
    roles: ['admin', 'hr', 'leader'] as const,
  },
]

export function PointTypeSelector({ userRole, className }: PointTypeSelectorProps) {
  const pointTypes = [
    { ...pointTypeBases[0], label: m.points_bintang(), description: m.point_type_bintang_desc() },
    { ...pointTypeBases[1], label: m.points_penalti(), description: m.point_type_penalti_desc() },
    { ...pointTypeBases[2], label: m.points_poin_aha(), description: m.point_type_poin_aha_desc() },
  ]

  const available = pointTypes.filter((t) =>
    (t.roles as readonly string[]).includes(userRole),
  )

  return (
    <div className={cn('grid gap-3', className)}>
      {available.map((type) => {
        const Icon = type.icon
        return (
          <Link
            key={type.code}
            to={type.href}
            className={cn(
              'flex items-center gap-4 rounded-xl border p-4 transition-colors',
              type.bg,
              type.border,
            )}
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-card/80">
              <Icon className={cn('h-6 w-6', type.color)} />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{type.label}</p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
