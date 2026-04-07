import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Award, Trophy, Gift, User } from 'lucide-react'
import { cn } from '~/lib/utils'
import * as m from '~/paraglide/messages'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard },
  { to: '/points', icon: Award },
  { to: '/leaderboard', icon: Trophy },
  { to: '/rewards', icon: Gift },
  { to: '/profile', icon: User },
] as const

function getNavLabels() {
  return [m.nav_dashboard(), m.nav_points(), m.nav_leaderboard(), m.nav_rewards(), m.nav_profile()]
}

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const labels = getNavLabels()
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch',
        'bg-[#151C3B] border-t border-white/8',
        className,
      )}
    >
      {navItems.map(({ to, icon: Icon }, index) => (
        <Link
          key={to}
          to={to}
          className="relative flex flex-1 flex-col items-center justify-center gap-1 text-white/40 transition-colors duration-200 hover:text-white/70 min-h-[44px]"
          activeProps={{ className: 'text-[#F4C144] bnav-active' }}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-semibold leading-none tracking-wide">{labels[index]}</span>
        </Link>
      ))}
    </nav>
  )
}
