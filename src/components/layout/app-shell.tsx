import { useState, type ReactNode } from 'react'
import { TopBar } from './top-bar'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { PullToRefresh } from '~/components/ui/pull-to-refresh'

interface AppShellProps {
  user: { name: string; role: string; avatarUrl: string | null }
  unreadCount: number
  children: ReactNode
}

export function AppShell({ user, unreadCount, children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <TopBar user={user} unreadCount={unreadCount} className="md:hidden" />
      <Sidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        className="hidden md:flex"
      />

      <div
        className="transition-[margin-left] duration-200"
        style={{ marginLeft: `var(--sidebar-width, 0px)` }}
      >
        <Header user={user} unreadCount={unreadCount} className="hidden md:flex" />
        <PullToRefresh>
          <main className="page-transition pt-14 pb-16 md:pt-0 md:pb-0 px-4 md:px-6 max-w-screen-xl mx-auto">
            {children}
          </main>
        </PullToRefresh>
      </div>

      <BottomNav className="md:hidden" />

      <style>{`
        :root { --sidebar-width: 0px; }
        @media (min-width: 768px) {
          :root { --sidebar-width: ${sidebarCollapsed ? '4rem' : '16rem'}; }
        }
      `}</style>
    </div>
  )
}
