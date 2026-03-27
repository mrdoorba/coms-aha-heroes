import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'
import type { PointStatus } from '~/shared/constants'

const statusConfig: Record<PointStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  challenged: { label: 'Challenged', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  frozen: { label: 'Frozen', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  revoked: { label: 'Revoked', className: 'bg-red-100 text-red-700 border-red-200' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
}

type StatusBadgeProps = {
  readonly status: PointStatus
  readonly className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
