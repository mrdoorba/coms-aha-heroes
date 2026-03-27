import { Bell, User } from 'lucide-react'
import { cn } from '~/lib/utils'

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
        'fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between bg-primary-dark px-4',
        className,
      )}
    >
      <span className="font-manrope text-lg font-extrabold tracking-wide text-white">
        AHA HEROES
      </span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold leading-none text-black">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xs font-bold text-white">
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
      </div>
    </header>
  )
}
