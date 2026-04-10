import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, User, ChevronDown, Search, LogOut } from 'lucide-react'
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
        'bg-card/80 border-border border-b backdrop-blur-md',
        'shadow-[0_1px_0_0_rgba(29,56,139,0.06)] dark:shadow-none',
        className,
      )}
    >
      {/* Command palette trigger */}
      <button
        type="button"
        onClick={onOpenPalette}
        className={cn(
          'border-border bg-muted flex w-full max-w-xs items-center gap-2.5 rounded-xl border',
          'text-muted-foreground/70 h-9 px-3 text-sm transition-all',
          'hover:border-primary/25 hover:bg-card hover:text-muted-foreground',
          'cursor-pointer select-none',
        )}
        aria-label="Open command palette"
      >
        <Search className="text-muted-foreground/60 h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">{m.header_search_placeholder()}</span>
        <kbd className="border-border bg-card/70 text-primary/50 flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold shadow-sm">
          <span className="text-[11px]">⌘</span>K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="border-border bg-muted flex items-center overflow-hidden rounded-lg border">
          {LANGUAGES.map((lang) => {
            const isActive = getLocale() === lang
            return (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  if (!isActive) setLocale(lang)
                }}
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
          className="text-muted-foreground hover:bg-primary/8 hover:text-primary relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F4C144] text-[9px] leading-none font-bold text-[#7a5800]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-primary/6 flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors">
            <div className="bg-primary/15 text-primary ring-primary/20 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-xs font-bold ring-1">
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
            <span className="text-foreground max-w-[120px] truncate text-sm font-semibold">
              {user.name}
            </span>
            <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => navigate({ to: '/profile' })}
            >
              <User className="h-4 w-4" />
              {m.nav_profile()}
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
