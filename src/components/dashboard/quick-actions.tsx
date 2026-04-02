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
}

export function QuickActions({ role }: QuickActionsProps) {
  const [open, setOpen] = useState(false)

  const actions: ActionItem[] = [
    {
      label: m.quick_action_bintang(),
      to: '/points/new/bintang',
      icon: <Star className="h-4 w-4" />,
      gradientClass: 'btn-gradient-gold text-white',
    },
    {
      label: m.quick_action_poin_aha(),
      to: '/points/new/poin-aha',
      icon: <Award className="h-4 w-4" />,
      gradientClass: 'btn-gradient-blue text-white',
    },
    ...(role === 'leader' || role === 'hr' || role === 'admin'
      ? [
          {
            label: m.quick_action_penalti(),
            to: '/points/new/penalti',
            icon: <AlertTriangle className="h-4 w-4" />,
            gradientClass: 'btn-gradient-purple text-white',
          } satisfies ActionItem,
        ]
      : []),
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
                'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg',
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
            'flex h-13 w-13 items-center justify-center rounded-full shadow-xl transition-all active:scale-95',
            open
              ? 'bg-gray-600 text-white rotate-0'
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
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm',
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
