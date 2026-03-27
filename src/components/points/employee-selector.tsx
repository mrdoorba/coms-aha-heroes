import { useState, useEffect, useRef } from 'react'
import { Search, User } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

type Employee = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: string
  readonly avatarUrl: string | null
}

type EmployeeSelectorProps = {
  readonly employees: readonly Employee[]
  readonly value?: string
  readonly onChange: (id: string) => void
  readonly excludeId?: string
  readonly className?: string
}

export function EmployeeSelector({
  employees,
  value,
  onChange,
  excludeId,
  className,
}: EmployeeSelectorProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = employees.find((e) => e.id === value)

  const filtered = employees.filter((e) => {
    if (e.id === excludeId) return false
    if (!search) return true
    const q = search.toLowerCase()
    return e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {selected && !isOpen ? (
        <button
          type="button"
          className="flex items-center gap-3 w-full rounded-lg border border-border bg-card p-3 text-left hover:bg-muted/50 transition-colors"
          onClick={() => {
            setIsOpen(true)
            setSearch('')
          }}
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{selected.name}</p>
            <p className="text-xs text-muted-foreground">{selected.email}</p>
          </div>
        </button>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-9"
          />
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground text-center">
              No employees found
            </p>
          ) : (
            filtered.map((emp) => (
              <button
                key={emp.id}
                type="button"
                className={cn(
                  'flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors',
                  emp.id === value && 'bg-primary/5',
                )}
                onClick={() => {
                  onChange(emp.id)
                  setIsOpen(false)
                  setSearch('')
                }}
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{emp.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
