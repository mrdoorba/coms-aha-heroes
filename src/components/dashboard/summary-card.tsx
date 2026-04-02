import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '~/lib/utils'

type SummaryCardProps = {
  title: string
  value: number
  icon: ReactNode
  iconBg: string
  iconColor: string
  variant?: 'gold' | 'blue' | 'purple' | 'pending'
  href?: string
}

const VARIANT_STYLES = {
  gold: {
    gradient: 'from-[#F4C144] to-[#FFD97D]',
    iconBg: 'bg-white/25',
    iconColor: 'text-white',
    valueBg: '',
  },
  blue: {
    gradient: 'from-[#325FEC] to-[#759EEE]',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    valueBg: '',
  },
  purple: {
    gradient: 'from-[#6D50B8] to-[#9681D4]',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    valueBg: '',
  },
  pending: {
    gradient: 'from-[#F4C144]/20 to-[#FFD97D]/10',
    iconBg: 'bg-[#F4C144]/20',
    iconColor: 'text-[#F4C144]',
    valueBg: 'pulse-gold',
  },
}

export function SummaryCard({ title, value, icon, variant = 'blue', href }: SummaryCardProps) {
  const styles = VARIANT_STYLES[variant]
  const isColoredTop = variant !== 'pending'

  const content = (
    <>
      {/* Gradient header — icon + title stacked */}
      <div
        className={cn(
          'flex flex-col items-start gap-1.5 px-4 py-3 bg-gradient-to-r',
          styles.gradient,
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            styles.iconBg,
          )}
        >
          <span className={cn('h-5 w-5', styles.iconColor)}>{icon}</span>
        </div>
        <p
          className={cn(
            'text-xs font-semibold leading-tight',
            isColoredTop ? 'text-white/90' : 'text-[#1D388B]',
          )}
        >
          {title}
        </p>
      </div>
      {/* Value */}
      <div className={cn('px-4 py-3', styles.valueBg)}>
        <p className="stat-enter text-2xl font-extrabold text-primary-dark">
          {value.toLocaleString()}
        </p>
      </div>
    </>
  )

  const className = 'group overflow-hidden rounded-xl bg-card shadow-card transition-all duration-200 hover:shadow-modal hover:-translate-y-0.5'

  if (href) {
    return (
      <Link to={href} className={cn(className, 'block')}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}
