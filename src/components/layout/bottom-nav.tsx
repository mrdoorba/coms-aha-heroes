import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Award, Trophy, User } from 'lucide-react'
import { cn } from '~/lib/utils'
import * as m from '~/paraglide/messages'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard },
  { to: '/points', icon: Award },
  { to: '/leaderboard', icon: Trophy },
  { to: '/profile', icon: User },
] as const

function getNavLabels() {
  return [m.nav_dashboard(), m.nav_points(), m.nav_leaderboard(), m.nav_profile()]
}

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const labels = getNavLabels()
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-white',
        className,
      )}
    >
      {navItems.map(({ to, icon: Icon }, index) => (
        <Link
          key={to}
          to={to}
          className="relative flex flex-1 flex-col items-center justify-center gap-0.5 text-gray-400 transition-colors duration-200 hover:text-[#325FEC]"
          activeProps={{ className: 'text-[#325FEC] bnav-active' }}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">{labels[index]}</span>
        </Link>
      ))}
    </nav>
  )
}
