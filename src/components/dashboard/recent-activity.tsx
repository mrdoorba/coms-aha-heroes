import { Link } from '@tanstack/react-router'
import { cn } from '~/lib/utils'
import * as m from '~/paraglide/messages'

export type ActivityItem = {
  id: string
  categoryCode: string
  categoryName: string
  points: number
  status: string
  reason: string
  userName: string
  userAvatarUrl: string | null
  submitterName: string
  createdAt: string
}

type RecentActivityProps = {
  items: ActivityItem[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function getCategoryColor(code: string): string {
  if (code.toUpperCase().includes('BINTANG')) return 'bg-yellow-100 text-yellow-800'
  if (code.toUpperCase().includes('PENALTI')) return 'bg-purple-100 text-purple-800'
  return 'bg-blue-100 text-blue-800'
}

function getStatusColor(status: string): string {
  if (status === 'approved') return 'bg-green-100 text-green-700'
  if (status === 'rejected') return 'bg-red-100 text-red-700'
  return 'bg-yellow-100 text-yellow-700'
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm text-muted-foreground">{m.activity_empty()}</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to="/points/$id"
            params={{ id: item.id }}
            className="card-hover flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              {item.userAvatarUrl ? (
                <img src={item.userAvatarUrl} alt={item.userName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">
                  {getInitials(item.userName)}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <span className="font-medium">{item.userName}</span>
                {' '}{m.activity_received()}{' '}
                <span className={cn('inline-block rounded px-1 text-xs font-semibold', getCategoryColor(item.categoryCode))}>
                  {item.categoryName}
                </span>
                {' '}{m.activity_from()}{' '}
                <span className="font-medium">{item.submitterName}</span>
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize', getStatusColor(item.status))}>
                  {item.status}
                </span>
                <span className="text-[11px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
              </div>
            </div>

            {/* Points */}
            <span className="shrink-0 text-sm font-bold text-primary">+{item.points}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
