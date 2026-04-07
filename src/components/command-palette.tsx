import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Search,
  X,
  LayoutDashboard,
  Award,
  Trophy,
  Gift,
  ShoppingCart,
  Users,
  Building2,
  Settings,
  FileText,
  BarChart3,
  Bell,
  User,
  RefreshCw,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import * as m from '~/paraglide/messages'

interface CommandItem {
  id: string
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  group: 'navigation' | 'admin'
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  role: string
}

const NAV_ITEMS: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, group: 'navigation' },
  { id: 'points', label: 'Points', to: '/points', icon: Award, group: 'navigation' },
  { id: 'leaderboard', label: 'Leaderboard', to: '/leaderboard', icon: Trophy, group: 'navigation' },
  { id: 'rewards', label: 'Rewards', to: '/rewards', icon: Gift, group: 'navigation' },
  { id: 'redemptions', label: 'Redemptions', to: '/redemptions', icon: ShoppingCart, group: 'navigation' },
  { id: 'notifications', label: 'Notifications', to: '/notifications', icon: Bell, group: 'navigation' },
  { id: 'profile', label: 'Profile', to: '/profile', icon: User, group: 'navigation' },
]

const ADMIN_ITEMS: CommandItem[] = [
  { id: 'users', label: 'Users', to: '/users', icon: Users, group: 'admin' },
  { id: 'teams', label: 'Teams', to: '/teams', icon: Building2, group: 'admin' },
  { id: 'reports', label: 'Reports', to: '/reports', icon: BarChart3, group: 'admin' },
  { id: 'audit-log', label: 'Audit Log', to: '/admin/audit-log', icon: FileText, group: 'admin' },
  { id: 'sheet-sync', label: 'Sheet Sync', to: '/admin/sheet-sync', icon: RefreshCw, group: 'admin' },
  { id: 'settings', label: 'Settings', to: '/settings', icon: Settings, group: 'admin' },
]

function getLabel(item: CommandItem) {
  switch (item.id) {
    case 'dashboard': return m.nav_dashboard()
    case 'points': return m.nav_points()
    case 'leaderboard': return m.nav_leaderboard()
    case 'rewards': return m.nav_rewards()
    case 'redemptions': return m.nav_redemptions()
    case 'notifications': return m.nav_notifications()
    case 'profile': return m.nav_profile()
    case 'users': return m.nav_users()
    case 'teams': return m.nav_teams()
    case 'reports': return m.nav_reports()
    case 'audit-log': return m.nav_audit_log()
    case 'sheet-sync': return 'Sheet Sync'
    case 'settings': return m.nav_settings()
    default: return item.label
  }
}

export function CommandPalette({ open, onClose, role }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const isAdminOrHr = role === 'admin' || role === 'hr'

  const allItems = isAdminOrHr ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS

  const filtered = query.trim()
    ? allItems.filter((item) => {
        const label = getLabel(item).toLowerCase()
        const q = query.toLowerCase()
        return label.includes(q)
      })
    : allItems

  // Group filtered results
  const navFiltered = filtered.filter((i) => i.group === 'navigation')
  const adminFiltered = filtered.filter((i) => i.group === 'admin')

  const flatFiltered = [...navFiltered, ...adminFiltered]

  const handleSelect = useCallback(
    (item: CommandItem) => {
      navigate({ to: item.to })
      onClose()
      setQuery('')
      setActiveIndex(0)
    },
    [navigate, onClose],
  )

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, flatFiltered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        const item = flatFiltered[activeIndex]
        if (item) handleSelect(item)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, flatFiltered, activeIndex, handleSelect, onClose])

  // Clamp active index when filter changes
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Desktop modal / Mobile full-screen */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={cn(
          'fixed z-[101]',
          // Mobile: full-screen
          'inset-0 flex flex-col bg-white',
          // Desktop: centered modal
          'md:inset-auto md:top-[20vh] md:left-1/2 md:-translate-x-1/2',
          'md:w-full md:max-w-xl md:rounded-2xl',
          'md:border md:border-[#325FEC]/15',
          'md:bg-white/95 md:backdrop-blur-xl',
          'md:shadow-[0_24px_80px_rgba(29,56,139,0.18),0_4px_16px_rgba(29,56,139,0.08)]',
          'md:overflow-hidden',
        )}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 border-b border-[#325FEC]/10 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[#325FEC]/60" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={m.header_search_placeholder()}
            className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            aria-autocomplete="list"
            aria-controls="command-palette-list"
            aria-activedescendant={flatFiltered[activeIndex] ? `cmd-item-${flatFiltered[activeIndex].id}` : undefined}
          />
          {/* ⌘K badge — desktop only */}
          <kbd className="hidden md:flex items-center gap-0.5 rounded-md border border-[#325FEC]/15 bg-[#EDF1FA] px-1.5 py-0.5 text-[10px] font-semibold text-[#325FEC]/60 select-none">
            <span className="text-[11px]">⌘</span>K
          </kbd>
          {/* Close button — mobile only */}
          <button
            type="button"
            onClick={onClose}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-[#325FEC]/8 hover:text-[#325FEC] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          className="flex-1 overflow-y-auto px-2 py-2 md:max-h-[400px]"
        >
          {flatFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <Search className="mb-3 h-8 w-8 opacity-20" />
              <p>No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <>
              {navFiltered.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-widest text-[#325FEC]/40">
                    Navigation
                  </p>
                  {navFiltered.map((item) => {
                    const globalIdx = flatFiltered.indexOf(item)
                    const isActive = globalIdx === activeIndex
                    return (
                      <ItemRow
                        key={item.id}
                        item={item}
                        label={getLabel(item)}
                        isActive={isActive}
                        onSelect={handleSelect}
                        onHover={() => setActiveIndex(globalIdx)}
                      />
                    )
                  })}
                </div>
              )}

              {adminFiltered.length > 0 && (
                <div className={navFiltered.length > 0 ? 'mt-2' : ''}>
                  <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-widest text-[#325FEC]/40">
                    Admin
                  </p>
                  {adminFiltered.map((item) => {
                    const globalIdx = flatFiltered.indexOf(item)
                    const isActive = globalIdx === activeIndex
                    return (
                      <ItemRow
                        key={item.id}
                        item={item}
                        label={getLabel(item)}
                        isActive={isActive}
                        onSelect={handleSelect}
                        onHover={() => setActiveIndex(globalIdx)}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer hint — desktop only */}
        <div className="hidden md:flex items-center gap-3 border-t border-[#325FEC]/8 px-4 py-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <kbd className="rounded border border-[#325FEC]/10 bg-[#EDF1FA] px-1 py-0.5 font-mono text-[9px]">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <kbd className="rounded border border-[#325FEC]/10 bg-[#EDF1FA] px-1 py-0.5 font-mono text-[9px]">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <kbd className="rounded border border-[#325FEC]/10 bg-[#EDF1FA] px-1 py-0.5 font-mono text-[9px]">esc</kbd>
            close
          </span>
        </div>
      </div>
    </>
  )
}

interface ItemRowProps {
  item: CommandItem
  label: string
  isActive: boolean
  onSelect: (item: CommandItem) => void
  onHover: () => void
}

function ItemRow({ item, label, isActive, onSelect, onHover }: ItemRowProps) {
  const Icon = item.icon
  return (
    <button
      id={`cmd-item-${item.id}`}
      role="option"
      aria-selected={isActive}
      data-active={isActive}
      type="button"
      onClick={() => onSelect(item)}
      onMouseEnter={onHover}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
        'text-foreground/80 hover:bg-[#325FEC]/8 hover:text-foreground',
        isActive && 'bg-[#325FEC]/10 text-[#325FEC]',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          isActive ? 'bg-[#325FEC]/15 text-[#325FEC]' : 'bg-[#EDF1FA] text-[#325FEC]/60',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="font-medium">{label}</span>
    </button>
  )
}
