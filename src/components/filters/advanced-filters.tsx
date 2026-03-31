import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import * as m from '~/paraglide/messages'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

type FilterChild = {
  readonly key: string
  readonly node: React.ReactNode
}

type AdvancedFiltersProps = {
  readonly children: FilterChild[]
  readonly onClear: () => void
  readonly hasActiveFilters: boolean
  readonly className?: string
}

export function AdvancedFilters({
  children,
  onClear,
  hasActiveFilters,
  className,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 text-xs gap-1',
            hasActiveFilters && 'border-[#325FEC] text-[#325FEC]',
          )}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? (
            <>
              {m.filter_hide_advanced()}
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              {m.filter_advanced()}
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground gap-1"
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5" />
            {m.filter_clear()}
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="grid gap-3 rounded-lg border border-border bg-white p-3 sm:grid-cols-2">
          {children.map((child) => (
            <div key={child.key}>{child.node}</div>
          ))}
        </div>
      )}
    </div>
  )
}
