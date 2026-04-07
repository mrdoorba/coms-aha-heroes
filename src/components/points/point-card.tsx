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

const POINT_VALUE_STYLE: Record<PointCategoryCode, string> = {
  PENALTI: 'text-[#C73E3E] bg-[#C73E3E]/8',
  BINTANG: 'text-[#a07700] bg-[#F4C144]/12',
  POIN_AHA: 'text-[#325FEC] bg-[#325FEC]/8',
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
  const prefix = categoryCode === 'PENALTI' ? '-' : '+'
  const ptStyle = POINT_VALUE_STYLE[categoryCode]

  return (
    <Link
      to="/points/$id"
      params={{ id }}
      className="flex items-center gap-3 rounded-2xl bg-white border border-[#325FEC]/8 px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(29,56,139,0.10)] group"
    >
      <CategoryIcon code={categoryCode} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground truncate">{userName}</span>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5 leading-snug">{reason}</p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          {new Date(createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      <span className={`shrink-0 rounded-xl px-2.5 py-1.5 text-base font-extrabold leading-none ${ptStyle}`}>
        {prefix}{points}
      </span>
    </Link>
  )
}
