import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Award, Trophy, Gift, ShoppingCart, Users, Building2, Settings, FileText, BarChart3, User, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '~/lib/utils'

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/points', icon: Award, label: 'Points' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/rewards', icon: Gift, label: 'Rewards' },
  { to: '/redemptions', icon: ShoppingCart, label: 'Redemptions' },
] as const

const adminNavItems = [
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/teams', icon: Building2, label: 'Teams' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/audit-log', icon: FileText, label: 'Audit Log' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

interface SidebarProps {
  user: { name: string; role: string; avatarUrl: string | null }
  collapsed: boolean
  onToggleCollapse: () => void
  className?: string
}

export function Sidebar({ user, collapsed, onToggleCollapse, className }: SidebarProps) {
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
        'fixed top-0 left-0 z-40 flex h-full flex-col border-r border-border bg-white transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <span className="font-manrope text-lg font-extrabold tracking-wide text-primary-dark">
            AHA HEROES
          </span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            collapsed && 'mx-auto',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {mainNavItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center px-0',
            )}
            activeProps={{ className: 'bg-primary/10 text-primary' }}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && label}
          </Link>
        ))}

        {isAdminOrHr && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Admin
                </span>
              </div>
            )}
            {collapsed && <div className="my-2 border-t border-border" />}
            {adminNavItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center px-0',
                )}
                activeProps={{ className: 'bg-primary/10 text-primary' }}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border p-2">
        <div className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5',
          collapsed && 'justify-center px-0',
        )}>
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
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {user.role}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
