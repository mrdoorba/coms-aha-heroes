import { useState } from 'react'
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

const LANGUAGES = ['id', 'en', 'th'] as const

interface HeaderProps {
  user: { name: string; avatarUrl: string | null }
  unreadCount: number
  className?: string
}

export function Header({ user, unreadCount, className }: HeaderProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate({ to: '/points', search: { q: trimmed } })
    setQuery('')
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between px-6',
        'bg-white/80 backdrop-blur-md border-b border-[#325FEC]/8',
        'shadow-[0_1px_0_0_rgba(29,56,139,0.06)]',
        className,
      )}
    >
      {/* Search */}
      <form onSubmit={handleSearch} className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={m.header_search_placeholder()}
          className="h-9 w-full rounded-xl border border-[#325FEC]/12 bg-[#EDF1FA] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-[#325FEC]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#325FEC]/15 transition-all"
        />
      </form>

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
