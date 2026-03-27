import { Bell, User, ChevronDown } from 'lucide-react'
import { cn } from '~/lib/utils'

const LANGUAGES = ['ID', 'EN', 'TH'] as const

interface HeaderProps {
  user: { name: string; avatarUrl: string | null }
  unreadCount: number
  className?: string
}

export function Header({ user, unreadCount, className }: HeaderProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-6',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Dashboard</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border border-border">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              className="px-2.5 py-1 text-xs font-medium text-muted-foreground first:rounded-l-md last:rounded-r-md hover:bg-accent hover:text-accent-foreground"
            >
              {lang}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold leading-none text-black">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
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
        </button>
      </div>
    </header>
  )
}
