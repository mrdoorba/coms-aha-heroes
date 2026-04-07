import { createFileRoute, Link } from '@tanstack/react-router'
import { Star, Award, AlertTriangle, Clock, ChevronRight, Zap } from 'lucide-react'
import * as m from '~/paraglide/messages'
import { SummaryCard } from '~/components/dashboard/summary-card'
import { RecentActivity } from '~/components/dashboard/recent-activity'
import { QuickActions } from '~/components/dashboard/quick-actions'
import { MiniLeaderboard } from '~/components/dashboard/mini-leaderboard'
import { getDashboardSummaryFn, getDashboardActivityFn } from '~/server/functions/dashboard'
import { getLeaderboardFn } from '~/server/functions/leaderboard'

export const Route = createFileRoute('/_authed/dashboard')({
  loader: async () => {
    const [summary, activity, leaderboard] = await Promise.all([
      getDashboardSummaryFn(),
      getDashboardActivityFn(),
      getLeaderboardFn({ data: { type: 'poin_aha', page: 1, limit: 5 } }),
    ])
    return { summary, activity, leaderboard }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { summary, activity, leaderboard } = Route.useLoaderData()
  const { session } = Route.useRouteContext()

  const role = session?.appUser?.role ?? 'employee'
  const name = session?.user?.name ?? ''
  const currentUserId = session?.appUser?.id ?? ''

  type RawEntry = { rank: number; name: string; avatarUrl: string | null; score: number; userId: string }
  const leaderboardEntries = ((leaderboard.entries ?? []) as RawEntry[]).map((e) => ({
    rank: e.rank,
    name: e.name,
    avatarUrl: e.avatarUrl,
    score: e.score,
    userId: e.userId,
  }))

  const showPendingBanner =
    (role === 'hr' || role === 'admin') && summary.pendingCount > 0

  // Greeting based on time of day
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? '☀️' : hour < 17 ? '⚡' : '🌙'

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pb-24 pt-5 md:pb-8">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1D388B] via-[#2550C8] to-[#325FEC] p-5 shadow-[0_8px_32px_rgba(29,56,139,0.35)]">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#F4C144]/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-4 left-16 h-20 w-20 rounded-full bg-[#759EEE]/20 blur-xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-white/60">{timeGreeting} {m.dashboard_welcome({ name: '' }).split(',')[0]}</p>
            <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-white">{name}</h1>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold capitalize text-white/90 backdrop-blur-sm">
              <Zap className="h-3 w-3 text-[#F4C144]" />
              {role}
            </span>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <span className="text-2xl">🏆</span>
          </div>
        </div>
      </div>

      {/* Pending approvals banner */}
      {showPendingBanner && (
        <Link
          to="/points"
          search={{ status: 'pending' }}
          className="group flex items-center justify-between rounded-xl bg-white border border-[#F4C144]/30 px-4 py-3 shadow-[0_2px_12px_rgba(244,193,68,0.15)] hover:shadow-[0_4px_20px_rgba(244,193,68,0.25)] hover:border-[#F4C144]/60 transition-all duration-200"
        >
          <span className="flex items-center gap-2.5 text-sm font-semibold text-[#1D388B]">
            <span className="pulse-gold flex h-8 w-8 items-center justify-center rounded-full bg-[#F4C144]/15">
              <Clock className="h-4 w-4 text-[#F4C144]" />
            </span>
            {m.dashboard_pending_review({ count: String(summary.pendingCount) })}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#F4C144] transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* Summary cards — 2x2 on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          title={m.dashboard_bintang_count()}
          value={summary.bintangCount}
          icon={<Star className="h-5 w-5" />}
          iconBg="bg-[#F4C144]/15"
          iconColor="text-[#F4C144]"
          variant="gold"
          href="/points?category=BINTANG"
        />
        <SummaryCard
          title={m.dashboard_poin_aha_balance()}
          value={summary.poinAhaBalance}
          icon={<Award className="h-5 w-5" />}
          iconBg="bg-[#325FEC]/10"
          iconColor="text-[#325FEC]"
          variant="blue"
          href="/points?category=POIN_AHA"
        />
        <SummaryCard
          title={m.dashboard_penalti_points()}
          value={summary.penaltiCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-[#C73E3E]/10"
          iconColor="text-[#C73E3E]"
          variant="red"
          href="/points?category=PENALTI"
        />
        <SummaryCard
          title={m.dashboard_pending_actions()}
          value={summary.pendingCount}
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-[#F4C144]/15"
          iconColor="text-[#F4C144]"
          variant="pending"
          href="/points?status=pending"
        />
      </div>

      {/* Quick Actions — desktop only (mobile has FAB) */}
      <div>
        <QuickActions role={role} />
      </div>

      {/* Two-column layout on desktop */}
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        {/* Recent Activity */}
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#1D388B]/60">
              {m.dashboard_recent_activity()}
            </h2>
            <Link
              to="/points"
              className="text-xs font-semibold text-[#325FEC] hover:underline flex items-center gap-0.5"
            >
              {m.mini_leaderboard_view_all()}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <RecentActivity items={activity} />
        </div>

        {/* Mini Leaderboard */}
        <div className="w-full md:w-64 shrink-0">
          <MiniLeaderboard entries={leaderboardEntries} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  )
}
