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

function getCategoryStyle(code: string): { bg: string; text: string; dot: string } {
  const upper = code.toUpperCase()
  if (upper.includes('BINTANG')) return { bg: 'bg-[#F4C144]/12', text: 'text-[#a07700]', dot: 'bg-[#F4C144]' }
  if (upper.includes('PENALTI')) return { bg: 'bg-[#C73E3E]/10', text: 'text-[#C73E3E]', dot: 'bg-[#C73E3E]' }
  return { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' }
}

function getStatusStyle(status: string): { bg: string; text: string } {
  if (status === 'approved' || status === 'active') return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' }
  if (status === 'rejected' || status === 'revoked') return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' }
  if (status === 'challenged') return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' }
  return { bg: 'bg-[#F4C144]/15', text: 'text-[#a07700]' }
}

function getPointStyle(code: string): string {
  const upper = code.toUpperCase()
  if (upper.includes('PENALTI')) return 'text-destructive bg-destructive/8'
  if (upper.includes('BINTANG')) return 'text-[#a07700] bg-[#F4C144]/12'
  return 'text-primary bg-primary/8'
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
      {items.map((item, i) => {
        const catStyle = getCategoryStyle(item.categoryCode)
        const statusStyle = getStatusStyle(item.status)
        const ptStyle = getPointStyle(item.categoryCode)
        const prefix = item.categoryCode.toUpperCase().includes('PENALTI') ? '-' : '+'

        return (
          <li key={item.id} className="stagger-item" style={{ animationDelay: `${i * 50}ms` }}>
            <Link
              to="/points/$id"
              params={{ id: item.id }}
              className="tap-active flex items-center gap-3 rounded-xl bg-card border border-border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] group"
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                {item.userAvatarUrl ? (
                  <img src={item.userAvatarUrl} alt={item.userName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{getInitials(item.userName)}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{item.userName}</span>
                  <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold', catStyle.bg, catStyle.text)}>
                    {item.categoryName}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize', statusStyle.bg, statusStyle.text)}>
                    {item.status}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">{formatRelativeTime(item.createdAt)}</span>
                </div>
              </div>

              {/* Points */}
              <span className={cn('shrink-0 rounded-lg px-2 py-1 text-sm font-extrabold', ptStyle)}>
                {prefix}{item.points}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
