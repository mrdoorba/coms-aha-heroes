import { useState, useEffect, type ReactNode } from 'react'
import { TopBar } from './top-bar'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { PullToRefresh } from '~/components/ui/pull-to-refresh'
import { CommandPalette } from '~/components/command-palette'

interface AppShellProps {
  user: { name: string; role: string; avatarUrl: string | null }
  unreadCount: number
  children: ReactNode
}

export function AppShell({ user, unreadCount, children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`app-bg min-h-screen ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      <TopBar
        user={{ name: user.name, role: user.role, avatarUrl: user.avatarUrl }}
        unreadCount={unreadCount}
        onOpenPalette={() => setPaletteOpen(true)}
        className="md:hidden"
      />
      <Sidebar
        user={user}
        collapsed={sidebarCollapsed}
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
        className="hidden md:flex"
      />

      <div className="transition-[margin-left] duration-200 md:ml-[var(--sidebar-width)]">
        <Header
          user={user}
          unreadCount={unreadCount}
          onOpenPalette={() => setPaletteOpen(true)}
          className="hidden md:flex"
        />
        <PullToRefresh>
          <main className="page-transition pt-14 pb-16 md:pt-0 md:pb-0 px-4 md:px-6 max-w-screen-xl mx-auto">
            {children}
          </main>
        </PullToRefresh>
      </div>

      <BottomNav className="md:hidden" />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        role={user.role}
      />
    </div>
  )
}
