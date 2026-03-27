import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Award, Trophy, User } from 'lucide-react'
import { cn } from '~/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/points', icon: Award, label: 'Points' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
] as const

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-white',
        className,
      )}
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-gray-600"
          activeProps={{ className: 'text-primary' }}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
