import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell, User, Trophy, Menu, X, LayoutDashboard, Award, Gift, ShoppingCart, Users, Building2, Settings, FileText, BarChart3, RefreshCw } from 'lucide-react'
import { cn } from '~/lib/utils'
import * as m from '~/paraglide/messages'

interface TopBarProps {
  user: { name: string; role: string; avatarUrl: string | null }
  unreadCount: number
  className?: string
}

const adminNavItems = [
  { to: '/dashboard', label: () => m.nav_dashboard(), icon: LayoutDashboard },
  { to: '/points', label: () => m.nav_points(), icon: Award },
  { to: '/rewards', label: () => m.nav_rewards(), icon: Gift },
  { to: '/redemptions', label: () => m.nav_redemptions(), icon: ShoppingCart },
  { to: '/users', label: () => m.nav_users(), icon: Users },
  { to: '/teams', label: () => m.nav_teams(), icon: Building2 },
  { to: '/reports', label: () => m.nav_reports(), icon: BarChart3 },
  { to: '/admin/audit-log', label: () => m.nav_audit_log(), icon: FileText },
  { to: '/admin/sheet-sync', label: () => m.nav_sheet_sync(), icon: RefreshCw },
  { to: '/settings', label: () => m.nav_settings(), icon: Settings },
] as const

export function TopBar({ user, unreadCount, className }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdminOrHr = user.role === 'admin' || user.role === 'hr'

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4',
          'bg-[#151C3B] border-b border-white/8',
          className,
        )}
      >
        <div className="flex items-center gap-2">
          {/* Hamburger — admin/HR only */}
          {isAdminOrHr && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/8 hover:text-white transition-colors -ml-1"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Logo */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#F4C144] to-[#FFD97D] shadow-md">
            <Trophy className="h-3.5 w-3.5 text-[#7a5800]" />
          </div>
          <span className="font-manrope text-[15px] font-extrabold tracking-wide text-white">
            AHA HEROES
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/8 hover:text-white transition-colors"
            aria-label={m.nav_notifications()}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F4C144] text-[9px] font-bold leading-none text-[#7a5800]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <Link
            to="/profile"
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#325FEC]/30 text-xs font-bold text-[#759EEE] ring-1 ring-white/15 hover:ring-[#759EEE]/50 transition-all"
          >
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
          </Link>
        </div>
      </header>

      {/* Slide-over menu — admin/HR only, mobile only */}
      {isAdminOrHr && menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMenuOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 left-0 z-[70] w-72 bg-white shadow-2xl md:hidden animate-slide-in-left">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-[#325FEC]/10 px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#F4C144] to-[#FFD97D] shadow-md">
                  <Trophy className="h-3.5 w-3.5 text-[#7a5800]" />
                </div>
                <span className="font-manrope text-[15px] font-extrabold tracking-wide text-[#1D388B]">
                  AHA HEROES
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#1D388B]/50 hover:bg-[#325FEC]/8 hover:text-[#1D388B] transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
              {adminNavItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#1D388B]/60 transition-all duration-150 hover:bg-[#325FEC]/8 hover:text-[#1D388B] min-h-[44px]"
                  activeProps={{ className: '!bg-[#325FEC]/10 !text-[#325FEC] !font-bold' }}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{label()}</span>
                </Link>
              ))}
            </nav>

            {/* User footer */}
            <div className="border-t border-[#325FEC]/10 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#325FEC]/10 text-xs font-bold text-[#325FEC] ring-1 ring-[#325FEC]/15">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                      width={36}
                      height={36}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span>{initials || <User className="h-4 w-4" />}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1D388B]">{user.name}</p>
                  <span className="inline-block rounded-full bg-[#325FEC]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#325FEC]">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
