import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
import { BarChart3, FileText, Star, AlertTriangle, Award, ShieldOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { SummaryCard } from '~/components/dashboard/summary-card'
import { getReportsFn } from '~/server/functions/reports'

type ReportsData = {
  totalSubmissions: number
  byCategory: Array<{ name: string; count: number }>
  byTeam: Array<{ name: string; total: number }>
  overTime: Array<{ date: string; count: number }>
}

export const Route = createFileRoute('/_authed/reports')({
  loader: async () => {
    const data = await getReportsFn({ data: {} })
    return { reports: data as ReportsData }
  },
  component: ReportsPage,
  pendingComponent: ReportsSkeleton,
})

function ReportsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 animate-pulse">
      <div className="flex items-center gap-3 pt-2">
        <div className="h-10 w-10 rounded-xl bg-muted" />
        <div className="space-y-1">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-3 w-40 rounded bg-muted" />
        </div>
      </div>
      <div className="h-16 rounded-xl border border-border bg-white" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-border bg-white" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 rounded-xl border border-border bg-white" />
      ))}
    </div>
  )
}

const CATEGORY_COLORS: Record<string, { bar: string; text: string }> = {
  bintang: { bar: 'bg-[#F4C144]', text: 'text-[#F4C144]' },
  penalti: { bar: 'bg-[#6D50B8]', text: 'text-[#6D50B8]' },
  poin_aha: { bar: 'bg-[#325FEC]', text: 'text-[#325FEC]' },
}

function categoryColor(name: string) {
  const key = name.toLowerCase().replace(/\s+/g, '_')
  if (key.includes('bintang')) return CATEGORY_COLORS.bintang
  if (key.includes('penalti')) return CATEGORY_COLORS.penalti
  return CATEGORY_COLORS.poin_aha
}

function categoryIcon(name: string) {
  const key = name.toLowerCase()
  if (key.includes('bintang')) return <Star className="h-4 w-4 text-[#F4C144]" />
  if (key.includes('penalti')) return <AlertTriangle className="h-4 w-4 text-[#6D50B8]" />
  return <Award className="h-4 w-4 text-[#325FEC]" />
}

function HorizontalBar({
  label,
  value,
  max,
  barClass,
}: {
  label: string
  value: number
  max: number
  barClass: string
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm text-muted-foreground">{label}</span>
      <div className="relative flex-1 h-5 rounded-full bg-[#96ADF5]/20 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-semibold text-[#1D388B]">{value}</span>
    </div>
  )
}

function ReportsPage() {
  const { reports: initialReports } = Route.useLoaderData()
  const { session } = Route.useRouteContext()

  const role = session?.appUser?.role ?? 'employee'

  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(thirtyDaysAgo)
  const [endDate, setEndDate] = useState(today)
  const [reports, setReports] = useState<ReportsData>(initialReports)
  const [isLoading, setIsLoading] = useState(false)

  if (role !== 'hr' && role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <ShieldOff className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold text-[#1D388B]">{m.common_access_denied()}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {m.common_no_permission()}
        </p>
      </div>
    )
  }

  async function fetchReports(opts: { start: string; end: string }) {
    setIsLoading(true)
    try {
      const data = await getReportsFn({
        data: { startDate: opts.start, endDate: opts.end },
      })
      setReports(data as ReportsData)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleStartDate(val: string) {
    setStartDate(val)
    fetchReports({ start: val, end: endDate })
  }

  function handleEndDate(val: string) {
    setEndDate(val)
    fetchReports({ start: startDate, end: val })
  }

  const byCategory = reports.byCategory ?? []
  const byTeam = reports.byTeam ?? []
  const overTime = reports.overTime ?? []

  const bintangCount = byCategory.find((c) => c.name.toLowerCase().includes('bintang'))?.count ?? 0
  const penaltiCount = byCategory.find((c) => c.name.toLowerCase().includes('penalti'))?.count ?? 0
  const poinAhaCount = byCategory.find((c) => c.name.toLowerCase().includes('poin'))?.count ?? 0

  const maxCategoryCount = Math.max(...byCategory.map((c) => c.count), 1)
  const maxTeamTotal = Math.max(...byTeam.map((t) => t.total), 1)
  const maxTimeCount = Math.max(...overTime.map((o) => o.count), 1)

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#325FEC]/10">
          <BarChart3 className="h-5 w-5 text-[#325FEC]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1D388B]">{m.reports_title()}</h1>
          <p className="text-xs text-muted-foreground">{m.reports_subtitle()}</p>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{m.reports_start_date()}</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => handleStartDate(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#325FEC]/40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{m.reports_end_date()}</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => handleEndDate(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#325FEC]/40"
            />
          </div>
          {isLoading && (
            <span className="self-end pb-1 text-xs text-muted-foreground animate-pulse">
              {m.common_loading()}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          title={m.reports_total_submissions()}
          value={reports.totalSubmissions}
          icon={<FileText className="h-5 w-5" />}
          iconBg="bg-[#759EEE]/15"
          iconColor="text-[#759EEE]"
        />
        <SummaryCard
          title={m.points_bintang()}
          value={bintangCount}
          icon={<Star className="h-5 w-5" />}
          iconBg="bg-[#F4C144]/15"
          iconColor="text-[#F4C144]"
        />
        <SummaryCard
          title={m.points_penalti()}
          value={penaltiCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-[#6D50B8]/10"
          iconColor="text-[#6D50B8]"
        />
        <SummaryCard
          title={m.points_poin_aha()}
          value={poinAhaCount}
          icon={<Award className="h-5 w-5" />}
          iconBg="bg-[#325FEC]/10"
          iconColor="text-[#325FEC]"
        />
      </div>

      {/* By Category */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1D388B]">
            {m.reports_by_category()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          {byCategory.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{m.common_no_data()}</p>
          ) : (
            byCategory.map((cat) => {
              const color = categoryColor(cat.name)
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="flex w-32 shrink-0 items-center gap-1.5">
                    {categoryIcon(cat.name)}
                    <span className="truncate text-sm text-muted-foreground">{cat.name}</span>
                  </div>
                  <div className="relative flex-1 h-5 rounded-full bg-[#96ADF5]/20 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                      style={{
                        width: `${Math.max(4, Math.round((cat.count / maxCategoryCount) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-semibold text-[#1D388B]">
                    {cat.count}
                  </span>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Top Teams */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1D388B]">
            {m.reports_top_teams()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          {byTeam.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{m.common_no_data()}</p>
          ) : (
            byTeam.map((team) => (
              <HorizontalBar
                key={team.name}
                label={team.name}
                value={team.total}
                max={maxTeamTotal}
                barClass="bg-[#325FEC]"
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Submissions Over Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1D388B]">
            {m.reports_over_time()}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {overTime.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{m.common_no_data()}</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1.5 min-w-0" style={{ minWidth: `${overTime.length * 36}px` }}>
                {overTime.map((point) => {
                  const heightPct = Math.max(8, Math.round((point.count / maxTimeCount) * 100))
                  const shortDate = point.date.slice(5) // MM-DD
                  return (
                    <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-[#1D388B]">{point.count}</span>
                      <div
                        className="w-full rounded-t-md bg-[#325FEC] transition-all duration-500"
                        style={{ height: `${heightPct * 1.2}px`, minHeight: '8px' }}
                        title={`${point.date}: ${point.count}`}
                      />
                      <span className="rotate-45 text-[9px] text-muted-foreground origin-left">
                        {shortDate}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
