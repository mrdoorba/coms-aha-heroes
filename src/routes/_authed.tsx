import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { getSessionFn } from '~/server/functions/auth'
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

    return { session }
  },
  component: AuthedLayout,
  pendingComponent: AuthedPending,
})

function AuthedLayout() {
  const { session } = Route.useRouteContext()

  const user = {
    name: session.user.name,
    role: session.appUser?.role ?? 'member',
    avatarUrl: session.user.image ?? null,
  }

  return (
    <AppShell
      user={user}
      unreadCount={0} // will be wired to /v1/notifications/unread-count via TanStack Query in a future step
    >
      <Outlet />
    </AppShell>
  )
}

function AuthedPending() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
      <span className="text-lg font-semibold tracking-tight text-[#1D388B]">AHA HEROES</span>
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}
