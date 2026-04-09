import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, User, ChevronDown, Search, KeyRound, LogOut } from 'lucide-react'
import { cn } from '~/lib/utils'
import { getLocale, setLocale } from '~/paraglide/runtime.js'
import * as m from '~/paraglide/messages'
import { signOut } from '~/lib/auth-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { ThemeToggle } from '~/components/theme-toggle'

const LANGUAGES = ['id', 'en', 'th'] as const

interface HeaderProps {
  user: { name: string; avatarUrl: string | null }
  unreadCount: number
  onOpenPalette?: () => void
  className?: string
}

export function Header({ user, unreadCount, onOpenPalette, className }: HeaderProps) {
  const navigate = useNavigate()

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between px-6',
        'bg-white/80 dark:bg-[oklch(0.12_0.025_265)]/80 backdrop-blur-md border-b border-[#325FEC]/8 dark:border-white/8',
        'shadow-[0_1px_0_0_rgba(29,56,139,0.06)]',
        className,
      )}
    >
      {/* Command palette trigger */}
      <button
        type="button"
        onClick={onOpenPalette}
        className={cn(
          'flex w-full max-w-xs items-center gap-2.5 rounded-xl border border-[#325FEC]/12 bg-[#EDF1FA]',
          'h-9 px-3 text-sm text-muted-foreground/70 transition-all',
          'hover:border-[#325FEC]/25 hover:bg-white hover:text-muted-foreground',
          'cursor-pointer select-none',
        )}
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        <span className="flex-1 text-left">{m.header_search_placeholder()}</span>
        <kbd className="flex items-center gap-0.5 rounded-md border border-[#325FEC]/15 bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-[#325FEC]/50 shadow-sm">
          <span className="text-[11px]">⌘</span>K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center rounded-lg border border-[#325FEC]/12 bg-[#EDF1FA] overflow-hidden">
          {LANGUAGES.map((lang) => {
            const isActive = getLocale() === lang
            return (
              <button
                key={lang}
                type="button"
                onClick={() => { if (!isActive) setLocale(lang) }}
                className={cn(
                  'px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-all',
                  isActive
                    ? 'bg-[#325FEC] text-white shadow-sm'
                    : 'text-muted-foreground hover:text-[#325FEC]',
                )}
              >
                {lang.toUpperCase()}
              </button>
            )
          })}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-[#325FEC]/8 hover:text-[#325FEC] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F4C144] text-[9px] font-bold leading-none text-[#7a5800]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-[#325FEC]/6 transition-colors">
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#325FEC]/15 text-xs font-bold text-[#325FEC] ring-1 ring-[#325FEC]/20">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                  width={28}
                  height={28}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span>{initials || <User className="h-3.5 w-3.5" />}</span>
              )}
            </div>
            <span className="text-sm font-semibold text-foreground max-w-[120px] truncate">{user.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => navigate({ to: '/profile' })}
            >
              <User className="h-4 w-4" />
              {m.nav_profile()}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => navigate({ to: '/change-password' })}
            >
              <KeyRound className="h-4 w-4" />
              {m.change_password_title()}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="flex items-center gap-2"
              onClick={async () => {
                await signOut()
                navigate({ to: '/login' })
              }}
            >
              <LogOut className="h-4 w-4" />
              {m.common_logout()}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
