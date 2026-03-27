import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

type NotificationRow = {
  id: string
  userId: string
  branchId: string
  type: string
  title: string
  body: string | null
  entityType: string | null
  entityId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

type PaginationMeta = {
  total: number
  page: number
  limit: number
}

type NotificationsResponse = {
  success: boolean
  data: NotificationRow[]
  meta: PaginationMeta
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay} days ago`
  return date.toLocaleDateString()
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'point_received':
      return <Award className="h-5 w-5 text-green-500" />
    case 'point_pending':
      return <Clock className="h-5 w-5 text-yellow-500" />
    case 'point_approved':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'point_rejected':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'point_needs_approval':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />
  }
}

async function fetchNotifications(opts: {
  page: number
  limit: number
  unread?: boolean
}): Promise<NotificationsResponse> {
  const params = new URLSearchParams({
    page: String(opts.page),
    limit: String(opts.limit),
  })
  if (opts.unread !== undefined) {
    params.set('unread', String(opts.unread))
  }
  const res = await fetch(`/api/v1/notifications?${params.toString()}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json() as Promise<NotificationsResponse>
}

async function markAllReadFn(): Promise<void> {
  const res = await fetch('/api/v1/notifications/read-all', {
    method: 'PATCH',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to mark all as read')
}

async function markOneFn(id: string): Promise<void> {
  const res = await fetch(`/api/v1/notifications/${id}/read`, {
    method: 'PATCH',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to mark notification as read')
}

export const Route = createFileRoute('/_authed/notifications')({
  loader: async (): Promise<NotificationsResponse> => {
    return fetchNotifications({ page: 1, limit: 20 })
  },
  component: NotificationsPage,
})

function NotificationsPage() {
  const initialData = Route.useLoaderData() as NotificationsResponse

  const [notificationsList, setNotificationsList] = useState<NotificationRow[]>(
    initialData.data ?? [],
  )
  const [meta, setMeta] = useState<PaginationMeta>(
    initialData.meta ?? { total: 0, page: 1, limit: 20 },
  )
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const totalPages = Math.ceil((meta.total ?? 0) / (meta.limit ?? 20))

  async function loadPage(newPage: number) {
    setIsLoading(true)
    try {
      const data = await fetchNotifications({ page: newPage, limit: 20 })
      setNotificationsList(data.data ?? [])
      setMeta(data.meta)
      setPage(newPage)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMarkAllRead() {
    await markAllReadFn()
    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  async function handleItemClick(notification: NotificationRow) {
    if (!notification.isRead) {
      await markOneFn(notification.id)
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      )
    }
    if (notification.entityType === 'achievement_points' && notification.entityId) {
      navigate({ to: '/points/$id', params: { id: notification.entityId } })
    }
  }

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1D388B]">Notifications</h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={handleMarkAllRead}
        >
          Mark all read
        </Button>
      </div>

      <div className="space-y-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl border border-border bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        ) : notificationsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Bell className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notificationsList.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className="block w-full text-left"
              onClick={() => handleItemClick(notification)}
            >
              <div
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted/50',
                  !notification.isRead && 'bg-primary/5',
                )}
              >
                <div className="mt-0.5 shrink-0">
                  <NotificationIcon type={notification.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{notification.title}</p>
                  {notification.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(new Date(notification.createdAt))}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="mt-1.5 shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => loadPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => loadPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
