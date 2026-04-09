import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Star, Award, AlertTriangle, Plus, X } from 'lucide-react'
import { cn } from '~/lib/utils'
import * as m from '~/paraglide/messages'

type QuickActionsProps = {
  role: string
}

type ActionItem = {
  label: string
  to: string
  icon: React.ReactNode
  gradientClass: string
  mobileDelay: string
}

export function QuickActions({ role }: QuickActionsProps) {
  const [open, setOpen] = useState(false)

  const actions: ActionItem[] = [
    {
      label: m.quick_action_bintang(),
      to: '/points/new/bintang',
      icon: <Star className="h-4 w-4" />,
      gradientClass: 'btn-gradient-gold text-[#7a5800]',
      mobileDelay: 'delay-75',
    },
    {
      label: m.quick_action_poin_aha(),
      to: '/points/new/poin-aha',
      icon: <Award className="h-4 w-4" />,
      gradientClass: 'btn-gradient-blue text-white',
      mobileDelay: 'delay-[40ms]',
    },
    {
      label: m.quick_action_penalti(),
      to: '/points/new/penalti',
      icon: <AlertTriangle className="h-4 w-4" />,
      gradientClass: 'btn-gradient-red text-white',
      mobileDelay: 'delay-0',
    },
  ]

  return (
    <>
      {/* Mobile FAB */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col-reverse items-end gap-2 md:hidden">
        {open &&
          actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold shadow-xl min-h-[44px]',
                action.gradientClass,
              )}
            >
              {action.icon}
              {action.label}
            </Link>
          ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-200 active:scale-95 min-h-[44px]',
            open
              ? 'bg-[#1D388B] text-white rotate-45'
              : 'btn-gradient-blue text-white',
          )}
          aria-label={m.quick_actions_label()}
        >
          {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop row */}
      <div className="hidden md:flex gap-3">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm min-h-[44px] shine-on-hover',
              action.gradientClass,
            )}
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>
    </>
  )
}
