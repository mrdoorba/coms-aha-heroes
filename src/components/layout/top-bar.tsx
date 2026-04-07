import { Link } from '@tanstack/react-router'
import { Bell, User, Trophy } from 'lucide-react'
import { cn } from '~/lib/utils'
import * as m from '~/paraglide/messages'

interface TopBarProps {
  user: { name: string; avatarUrl: string | null }
  unreadCount: number
  className?: string
}

export function TopBar({ user, unreadCount, className }: TopBarProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4',
        'bg-[#151C3B] border-b border-white/8',
        className,
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
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
            />
          ) : (
            <span>{initials || <User className="h-4 w-4" />}</span>
          )}
        </Link>
      </div>
    </header>
  )
}
