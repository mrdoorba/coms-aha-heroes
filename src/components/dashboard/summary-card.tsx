import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '~/lib/utils'

type SummaryCardProps = {
  title: string
  value: number
  icon: ReactNode
  iconBg: string
  iconColor: string
  variant?: 'gold' | 'blue' | 'red' | 'pending'
  href?: string
}

const VARIANT_STYLES = {
  gold: {
    gradient: 'from-[#F4C144] via-[#F9D46A] to-[#FFD97D]',
    iconBg: 'bg-white/25',
    iconColor: 'text-[#7a5800]',
    valueColor: 'text-[#7a5800]',
    titleColor: 'text-[#7a5800]/80',
    glow: 'shadow-[0_4px_20px_rgba(244,193,68,0.35)]',
    border: 'border-[#F4C144]/30',
  },
  blue: {
    gradient: 'from-[#325FEC] via-[#4B77F0] to-[#759EEE]',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-white/75',
    glow: 'shadow-[0_4px_20px_rgba(50,95,236,0.35)]',
    border: 'border-[#325FEC]/30',
  },
  red: {
    gradient: 'from-[#C73E3E] via-[#D45555] to-[#E06B6B]',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    valueColor: 'text-white',
    titleColor: 'text-white/75',
    glow: 'shadow-[0_4px_20px_rgba(199,62,62,0.30)]',
    border: 'border-[#C73E3E]/30',
  },
  pending: {
    gradient: 'from-white to-white',
    iconBg: 'bg-[#F4C144]/15',
    iconColor: 'text-[#F4C144]',
    valueColor: 'text-[#1D388B]',
    titleColor: 'text-muted-foreground',
    glow: 'shadow-card',
    border: 'border-[#F4C144]/25',
  },
}

export function SummaryCard({ title, value, icon, variant = 'blue', href }: SummaryCardProps) {
  const styles = VARIANT_STYLES[variant]
  const isPending = variant === 'pending'

  const content = (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border p-4 shine-on-hover',
      !isPending && `bg-gradient-to-br ${styles.gradient}`,
      isPending && 'bg-white',
      styles.border,
      styles.glow,
      'transition-all duration-200 hover:-translate-y-0.5',
      !isPending && 'hover:brightness-105',
      isPending && 'hover:shadow-[0_8px_24px_rgba(244,193,68,0.25)]',
    )}>
      {/* Subtle inner highlight for colored cards */}
      {!isPending && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 to-transparent rounded-2xl" />
      )}

      {/* Icon */}
      <div className={cn(
        'mb-3 flex h-10 w-10 items-center justify-center rounded-xl',
        styles.iconBg,
        isPending && 'pulse-gold',
      )}>
        <span className={cn('h-5 w-5', styles.iconColor)}>{icon}</span>
      </div>

      {/* Title */}
      <p className={cn('text-[11px] font-semibold leading-tight tracking-wide uppercase', styles.titleColor)}>
        {title}
      </p>

      {/* Value */}
      <p className={cn('stat-enter mt-1.5 text-2xl font-extrabold leading-none tracking-tight', styles.valueColor)}>
        {value.toLocaleString()}
      </p>
    </div>
  )

  if (href) {
    return (
      <Link to={href} className="block group">
        {content}
      </Link>
    )
  }

  return content
}
