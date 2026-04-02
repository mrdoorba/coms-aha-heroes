import { createFileRoute, Link } from '@tanstack/react-router'
import { Star, Award, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
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

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pb-24 pt-6 md:pb-8">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1D388B]">{m.dashboard_welcome({ name })}</h1>
          <span className="mt-1 inline-block rounded-full bg-gradient-to-r from-[#325FEC] to-[#759EEE] px-2.5 py-0.5 text-[11px] font-semibold capitalize text-white">
            {role}
          </span>
        </div>
      </div>

      {/* Pending approvals banner */}
      {showPendingBanner && (
        <Link
          to="/points"
          className="group flex items-center justify-between rounded-xl bg-gradient-to-r from-[#F4C144]/15 to-[#FFD97D]/10 px-4 py-3 text-sm font-medium text-[#1D388B] ring-1 ring-[#F4C144]/30 hover:ring-[#F4C144]/60 hover:from-[#F4C144]/25 hover:to-[#FFD97D]/15 transition-all duration-200"
        >
          <span className="flex items-center gap-1.5">
            <span className="pulse-gold flex h-7 w-7 items-center justify-center rounded-full bg-[#F4C144]/20">
              <Clock className="h-3.5 w-3.5 text-[#F4C144]" />
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
        />
        <SummaryCard
          title={m.dashboard_poin_aha_balance()}
          value={summary.poinAhaBalance}
          icon={<Award className="h-5 w-5" />}
          iconBg="bg-[#325FEC]/10"
          iconColor="text-[#325FEC]"
          variant="blue"
        />
        <SummaryCard
          title={m.dashboard_penalti_points()}
          value={summary.penaltiCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-[#6D50B8]/10"
          iconColor="text-[#6D50B8]"
          variant="purple"
        />
        <SummaryCard
          title={m.dashboard_pending_actions()}
          value={summary.pendingCount}
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-[#F4C144]/15"
          iconColor="text-[#F4C144]"
          variant="pending"
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
          <h2 className="mb-3 text-sm font-semibold text-[#1D388B]">{m.dashboard_recent_activity()}</h2>
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
