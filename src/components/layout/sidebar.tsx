import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Award, Trophy, Users, Building2, User } from 'lucide-react'
import { cn } from '~/lib/utils'

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/points', icon: Award, label: 'Points' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
] as const

const adminNavItems = [
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/teams', icon: Building2, label: 'Teams' },
] as const

interface SidebarProps {
  user: { name: string; role: string; avatarUrl: string | null }
  className?: string
}

export function Sidebar({ user, className }: SidebarProps) {
  const isAdminOrHr = user.role === 'admin' || user.role === 'hr'

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 flex h-full w-64 flex-col border-r border-border bg-white',
        className,
      )}
    >
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="font-manrope text-lg font-extrabold tracking-wide text-primary-dark">
          AHA HEROES
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {mainNavItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-accent hover:text-accent-foreground"
            activeProps={{ className: 'bg-primary/10 text-primary' }}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdminOrHr && (
          <>
            <div className="pt-4 pb-1 px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Admin
              </span>
            </div>
            {adminNavItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: 'bg-primary/10 text-primary' }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-xs font-bold text-primary">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials || <User className="h-4 w-4" />}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
