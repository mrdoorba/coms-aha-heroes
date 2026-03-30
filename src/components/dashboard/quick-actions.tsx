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
  colorClass: string
}

export function QuickActions({ role }: QuickActionsProps) {
  const [open, setOpen] = useState(false)

  const actions: ActionItem[] = [
    {
      label: m.quick_action_bintang(),
      to: '/points/new/bintang',
      icon: <Star className="h-4 w-4" />,
      colorClass: 'bg-[#F4C144] text-white hover:bg-[#e0ae38]',
    },
    {
      label: m.quick_action_poin_aha(),
      to: '/points/new/poin-aha',
      icon: <Award className="h-4 w-4" />,
      colorClass: 'bg-[#325FEC] text-white hover:bg-[#2a4fd0]',
    },
    ...(role === 'leader' || role === 'hr' || role === 'admin'
      ? [
          {
            label: m.quick_action_penalti(),
            to: '/points/new/penalti',
            icon: <AlertTriangle className="h-4 w-4" />,
            colorClass: 'bg-[#6D50B8] text-white hover:bg-[#5d43a0]',
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
                'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition-colors',
                action.colorClass,
              )}
            >
              {action.icon}
              {action.label}
            </Link>
          ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-13 w-13 items-center justify-center rounded-full bg-[#325FEC] text-white shadow-xl transition-transform active:scale-95"
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
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors',
              action.colorClass,
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
