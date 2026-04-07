import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
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

  if (diffSec < 60) return m.time_just_now()
  if (diffMin < 60) return m.time_minutes_ago({ count: String(diffMin) })
  if (diffHour < 24) return m.time_hours_ago({ count: String(diffHour) })
  if (diffDay === 1) return m.time_yesterday()
  if (diffDay < 7) return m.time_days_ago({ count: String(diffDay) })
  return date.toLocaleDateString()
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'point_received':
      return <Award className="h-5 w-5 text-[#22C55E]" />
    case 'point_pending':
      return <Clock className="h-5 w-5 text-[#F4C144]" />
    case 'point_approved':
      return <CheckCircle className="h-5 w-5 text-[#22C55E]" />
    case 'point_rejected':
      return <XCircle className="h-5 w-5 text-[#C73E3E]" />
    case 'point_needs_approval':
      return <AlertCircle className="h-5 w-5 text-[#F4C144]" />
    default:
      return <Bell className="h-5 w-5 text-[#325FEC]/50" />
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
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#325FEC]/10 shrink-0">
            <Bell className="h-5 w-5 text-[#325FEC]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1D388B]">{m.nav_notifications()}</h1>
            <p className="text-xs font-medium text-[#1D388B]/50">{meta.total} {m.nav_notifications().toLowerCase()}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-[#325FEC]/20 text-[#325FEC] hover:bg-[#325FEC]/8 hover:border-[#325FEC]/40 font-semibold text-xs min-h-[36px] transition-all duration-200"
          onClick={handleMarkAllRead}
        >
          {m.notifications_mark_all_read()}
        </Button>
      </div>

      <div className="space-y-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl border border-[#325FEC]/8 bg-[#325FEC]/4 animate-pulse"
              />
            ))}
          </div>
        ) : notificationsList.length === 0 ? (
          <div className="rounded-2xl border border-[#325FEC]/8 bg-white shadow-[0_2px_12px_rgba(29,56,139,0.07)] flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#325FEC]/8">
              <Bell className="h-7 w-7 text-[#325FEC]/40" />
            </div>
            <p className="font-semibold text-[#1D388B]/60">{m.notifications_empty()}</p>
          </div>
        ) : (
          notificationsList.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className="card-hover block w-full text-left"
              onClick={() => handleItemClick(notification)}
            >
              <div
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-[#325FEC]/8 px-4 py-3 transition-colors hover:bg-[#325FEC]/4 bg-white',
                  !notification.isRead && 'bg-[#325FEC]/5 border-[#325FEC]/15',
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
                  <div className="mt-1.5 shrink-0 h-2 w-2 rounded-full bg-[#325FEC]" />
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
            className="rounded-xl border-[#325FEC]/15 hover:bg-[#325FEC]/6 hover:text-[#325FEC] min-h-[36px]"
          >
            {m.common_previous()}
          </Button>
          <span className="rounded-xl bg-white border border-[#325FEC]/12 px-3 py-1.5 text-sm font-semibold text-[#1D388B]/60">
            {m.common_page_of({ page: String(page), total: String(totalPages) })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => loadPage(page + 1)}
            className="rounded-xl border-[#325FEC]/15 hover:bg-[#325FEC]/6 hover:text-[#325FEC] min-h-[36px]"
          >
            {m.common_next()}
          </Button>
        </div>
      )}
    </div>
  )
}
