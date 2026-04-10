import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { getSessionFn } from '~/server/functions/auth'
import { getUnreadCountFn } from '~/server/functions/notifications'
import { AppShell } from '~/components/layout/app-shell'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn()

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    if (session.appUser?.mustChangePassword) {
      throw redirect({ to: '/change-password' })
    }

    const { count: unreadCount } = await getUnreadCountFn().catch(() => ({
      count: 0,
    }))

    return { session, unreadCount }
  },
  component: AuthedLayout,
  pendingComponent: AuthedPending,
})

function AuthedLayout() {
  const { session, unreadCount } = Route.useRouteContext()

  const user = {
    name: session.user.name,
    role: session.appUser?.role ?? 'member',
    avatarUrl: session.user.image ?? null,
  }

  return (
    <AppShell user={user} unreadCount={unreadCount ?? 0}>
      <Outlet />
    </AppShell>
  )
}

function AuthedPending() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <span className="text-lg font-semibold tracking-tight text-foreground">AHA HEROES</span>
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}
