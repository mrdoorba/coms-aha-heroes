import type { ReactNode } from 'react'
import { TopBar } from './top-bar'
import { BottomNav } from './bottom-nav'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface AppShellProps {
  user: { name: string; role: string; avatarUrl: string | null }
  unreadCount: number
  children: ReactNode
}

export function AppShell({ user, unreadCount, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar user={user} unreadCount={unreadCount} className="md:hidden" />
      <Sidebar user={user} className="hidden md:flex" />

      <div className="md:ml-64">
        <Header user={user} unreadCount={unreadCount} className="hidden md:flex" />
        <main className="pt-14 pb-16 md:pt-0 md:pb-0 px-4 md:px-6 max-w-screen-xl mx-auto">
          {children}
        </main>
      </div>

      <BottomNav className="md:hidden" />
    </div>
  )
}
