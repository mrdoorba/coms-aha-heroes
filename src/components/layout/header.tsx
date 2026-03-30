import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, User, ChevronDown, Search, KeyRound, LogOut } from 'lucide-react'
import { cn } from '~/lib/utils'
import { getLocale, setLocale } from '~/paraglide/runtime.js'
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
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-6',
        className,
      )}
    >
      <form onSubmit={handleSearch} className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search points, users..."
          className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#325FEC] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#325FEC]"
        />
      </form>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border border-border">
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
                  'px-2.5 py-1 text-xs font-medium first:rounded-l-md last:rounded-r-md transition-colors',
                  isActive
                    ? 'bg-[#325FEC] text-white'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {lang.toUpperCase()}
              </button>
            )
          })}
        </div>

        <Link
          to="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold leading-none text-black">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-xs font-bold text-primary">
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
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => navigate({ to: '/profile' })}
            >
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => navigate({ to: '/change-password' })}
            >
              <KeyRound className="h-4 w-4" />
              Change Password
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
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
