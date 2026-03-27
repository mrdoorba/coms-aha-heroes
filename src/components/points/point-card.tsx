import { Link } from '@tanstack/react-router'
import { CategoryIcon } from './category-icon'
import { StatusBadge } from './status-badge'
import type { PointCategoryCode, PointStatus } from '~/shared/constants'

type PointCardProps = {
  readonly id: string
  readonly categoryCode: PointCategoryCode
  readonly userName: string
  readonly reason: string
  readonly points: number
  readonly status: PointStatus
  readonly createdAt: string
}

export function PointCard({
  id,
  categoryCode,
  userName,
  reason,
  points,
  status,
  createdAt,
}: PointCardProps) {
  const pointColor =
    categoryCode === 'PENALTI'
      ? 'text-purple-600'
      : categoryCode === 'BINTANG'
        ? 'text-yellow-600'
        : 'text-blue-600'

  const prefix = categoryCode === 'PENALTI' ? '-' : '+'

  return (
    <Link
      to="/points/$id"
      params={{ id }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <CategoryIcon code={categoryCode} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{userName}</span>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">{reason}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      <span className={`text-lg font-bold ${pointColor} shrink-0`}>
        {prefix}{points}
      </span>
    </Link>
  )
}
