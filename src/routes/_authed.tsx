import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSessionFn } from '~/server/functions/auth'

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
})

function AuthedLayout() {
  return <Outlet />
}
