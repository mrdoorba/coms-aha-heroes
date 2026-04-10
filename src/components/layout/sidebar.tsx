import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Award, Trophy, Gift, ShoppingCart, Users, Building2, Settings, FileText, BarChart3, User, RefreshCw } from 'lucide-react'
import { cn } from '~/lib/utils'
import * as m from '~/paraglide/messages'

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard },
  { to: '/points', icon: Award },
  { to: '/leaderboard', icon: Trophy },
  { to: '/rewards', icon: Gift },
  { to: '/redemptions', icon: ShoppingCart },
] as const

const adminNavItems = [
  { to: '/users', icon: Users },
  { to: '/teams', icon: Building2 },
  { to: '/reports', icon: BarChart3 },
  { to: '/admin/audit-log', icon: FileText },
  { to: '/admin/sheet-sync', icon: RefreshCw },
  { to: '/settings', icon: Settings },
] as const

function getMainNavLabels() {
  return [m.nav_dashboard(), m.nav_points(), m.nav_leaderboard(), m.nav_rewards(), m.nav_redemptions()]
}

function getAdminNavLabels() {
  return [m.nav_users(), m.nav_teams(), m.nav_reports(), m.nav_audit_log(), m.nav_sheet_sync(), m.nav_settings()]
}

interface SidebarProps {
  user: { name: string; role: string; avatarUrl: string | null }
  collapsed: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  className?: string
}

export function Sidebar({ user, collapsed, onMouseEnter, onMouseLeave, className }: SidebarProps) {
  const isAdminOrHr = user.role === 'admin' || user.role === 'hr'
  const mainLabels = getMainNavLabels()
  const adminLabels = getAdminNavLabels()

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 flex h-full flex-col transition-[width] duration-200',
        'bg-card border-r border-border',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-16 items-center border-b border-border',
        collapsed ? 'justify-center px-0' : 'px-4',
      )}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F4C144] to-[#FFD97D] shadow-md">
            <Trophy className="h-4 w-4 text-[#7a5800]" />
          </div>
          {!collapsed && (
            <span className="font-manrope text-[15px] font-extrabold tracking-wide text-foreground">
              AHA HEROES
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {mainNavItems.map(({ to, icon: Icon }, index) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-foreground',
              collapsed && 'justify-center px-0',
            )}
            activeProps={{ className: 'sidebar-link-active' }}
            title={collapsed ? mainLabels[index] : undefined}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="leading-none">{mainLabels[index]}</span>}
          </Link>
        ))}

        {isAdminOrHr && (
          <>
            <div className={cn('pt-4 pb-1.5', collapsed ? 'px-1' : 'px-3')}>
              {!collapsed ? (
                <span className="section-label text-muted-foreground/50">
                  {m.nav_admin()}
                </span>
              ) : (
                <div className="border-t border-border" />
              )}
            </div>
            {adminNavItems.map(({ to, icon: Icon }, index) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-foreground',
                  collapsed && 'justify-center px-0',
                )}
                activeProps={{ className: 'sidebar-link-active' }}
                title={collapsed ? adminLabels[index] : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="leading-none">{adminLabels[index]}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-2">
        <div className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5',
          collapsed && 'justify-center px-0',
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/15">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
                width={32}
                height={32}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span>{initials || <User className="h-4 w-4" />}</span>
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                {user.role}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
