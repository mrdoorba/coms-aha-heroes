import type { ReactNode } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { cn } from '~/lib/utils'

type SummaryCardProps = {
  title: string
  value: number
  icon: ReactNode
  iconBg: string
  iconColor: string
}

export function SummaryCard({ title, value, icon, iconBg, iconColor }: SummaryCardProps) {
  return (
    <Card className="flex-1">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', iconBg)}>
          <span className={cn('h-5 w-5', iconColor)}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-primary-dark">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  )
}
