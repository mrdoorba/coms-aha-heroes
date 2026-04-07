import { cn } from '~/lib/utils'
import type { PointStatus } from '~/shared/constants'

const statusConfig: Record<PointStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
  },
  pending: {
    label: 'Pending',
    className: 'bg-[#F4C144]/10 text-[#a07700] border border-[#F4C144]/30',
  },
  challenged: {
    label: 'Challenged',
    className: 'bg-purple-50 text-purple-700 border border-purple-200/70',
  },
  frozen: {
    label: 'Frozen',
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
  revoked: {
    label: 'Revoked',
    className: 'bg-red-50 text-red-600 border border-red-200/70',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-600 border border-red-200/70',
  },
}

type StatusBadgeProps = {
  readonly status: PointStatus
  readonly className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-none tracking-wide',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
