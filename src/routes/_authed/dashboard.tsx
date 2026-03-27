import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { signOut } from '~/lib/auth-client'

export const Route = createFileRoute('/_authed/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const { session } = Route.useRouteContext()

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-[#1D388B]">
          Welcome, {session.user.name}
        </h1>
        <p className="mt-2 text-gray-500">{session.user.email}</p>
        {session.appUser && (
          <span className="mt-3 inline-block rounded-full bg-[#325FEC] px-3 py-1 text-xs font-medium text-white">
            {session.appUser.role}
          </span>
        )}
        <div className="mt-6">
          <button
            onClick={handleSignOut}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
