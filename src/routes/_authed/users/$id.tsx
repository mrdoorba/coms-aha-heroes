import { useState } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
import {
  ArrowLeft,
  User,
  Star,
  Award,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { getEmployeeDetailFn, getEmployeeHistoryFn } from '~/server/functions/employee-detail'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { PointCategoryCode } from '~/shared/constants/point-categories'

export const Route = createFileRoute('/_authed/users/$id')({
  beforeLoad: ({ context }) => {
    const role = context.session?.appUser?.role
    if (!role || !['admin', 'hr', 'leader'].includes(role)) {
      throw redirect({ to: '/dashboard' })
    }
  },
  loader: async ({ params }) => {
    return getEmployeeDetailFn({ data: { userId: params.id } })
  },
  component: EmployeeDetailPage,
})

function formatDate(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatMonthYear(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
}

function formatChartLabel(yyyyMm: string) {
  const [year, month] = yyyyMm.split('-')
  const d = new Date(Number(year), Number(month) - 1)
  return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
}

const TAB_CONFIG: Record<
  PointCategoryCode,
  {
    color: string
    icon: typeof Star
    chartTitle: () => string
    historyTitle: (args: { count: string }) => string
    emptyText: () => string
  }
> = {
  BINTANG: {
    color: '#22C55E',
    icon: Star,
    chartTitle: () => m.employee_detail_chart_title(),
    historyTitle: (a) => m.employee_detail_history_title(a),
    emptyText: () => m.employee_detail_empty(),
  },
  POIN_AHA: {
    color: '#3B82F6',
    icon: Award,
    chartTitle: () => m.employee_detail_chart_title_aha(),
    historyTitle: (a) => m.employee_detail_history_title_aha(a),
    emptyText: () => m.employee_detail_empty_aha(),
  },
  PENALTI: {
    color: '#EF4444',
    icon: AlertTriangle,
    chartTitle: () => m.employee_detail_chart_title_penalti(),
    historyTitle: (a) => m.employee_detail_history_title_penalti(a),
    emptyText: () => m.employee_detail_empty_penalti(),
  },
}

function EmployeeDetailPage() {
  const { employee, summary, charts, points, meta, categoryMap } = Route.useLoaderData()
  const [tab, setTab] = useState<PointCategoryCode>('BINTANG')
  const [page, setPage] = useState(meta.page)
  const [currentPoints, setCurrentPoints] = useState(points)
  const [currentMeta, setCurrentMeta] = useState(meta)
  const [isLoading, setIsLoading] = useState(false)

  const totalPages = Math.ceil(currentMeta.total / currentMeta.limit)
  const tabConfig = TAB_CONFIG[tab]

  async function fetchHistory(category: PointCategoryCode, historyPage: number) {
    setIsLoading(true)
    try {
      const result = await getEmployeeHistoryFn({
        data: {
          userId: employee.id,
          categoryId: categoryMap[category],
          page: historyPage,
          limit: currentMeta.limit,
        },
      })
      setCurrentPoints(result.points)
      setCurrentMeta(result.meta)
      setPage(historyPage)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTabChange(newTab: PointCategoryCode) {
    setTab(newTab)
    await fetchHistory(newTab, 1)
  }

  async function handlePageChange(newPage: number) {
    await fetchHistory(tab, newPage)
  }

  const chartData = charts[tab].map((item) => ({
    label: formatChartLabel(item.month),
    count: item.count,
  }))

  return (
    <div className="page-transition mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Back + Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link to="/users">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/8 hover:text-primary h-9 w-9 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#325FEC] to-[#759EEE] shadow-[0_4px_12px_rgba(50,95,236,0.25)]">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-extrabold">{employee.name}</h1>
            <p className="text-muted-foreground mt-0.5 text-[13px] font-medium">
              {employee.teamName ?? '-'} &middot; {employee.department ?? '-'} &middot;{' '}
              {employee.position ?? '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="border-border bg-card shadow-card rounded-xl border p-4">
          <div className="text-muted-foreground flex items-center gap-2 text-[13px] font-semibold">
            <Star className="h-4 w-4 text-yellow-500" />
            {m.employee_detail_poin_bintang()}
          </div>
          <div className="text-foreground mt-1 text-2xl font-extrabold">{summary.bintangCount}</div>
        </div>
        <div className="border-border bg-card shadow-card rounded-xl border p-4">
          <div className="text-muted-foreground text-[13px] font-semibold">
            {m.employee_detail_poin_aha()}
          </div>
          <div className="text-primary mt-1 text-2xl font-extrabold">{summary.directPoinAha}</div>
        </div>
        <div className="border-border bg-card shadow-card rounded-xl border p-4">
          <div className="text-destructive/70 text-[13px] font-semibold">
            {m.employee_detail_penalti()}
          </div>
          <div className="text-destructive mt-1 text-2xl font-extrabold">
            {summary.penaltiPointsSum}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 flex gap-2">
        {(
          [
            { code: 'BINTANG' as const, label: m.employee_detail_poin_bintang() },
            { code: 'POIN_AHA' as const, label: m.employee_detail_poin_aha() },
            { code: 'PENALTI' as const, label: m.employee_detail_penalti() },
          ] as const
        ).map(({ code, label }) => {
          const Icon = TAB_CONFIG[code].icon
          const isActive = tab === code
          return (
            <button
              key={code}
              onClick={() => handleTabChange(code)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="border-border bg-card shadow-card mb-6 rounded-xl border p-5">
          <h2 className="text-foreground mb-4 text-sm font-bold">{tabConfig.chartTitle()}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={tabConfig.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Points History Table */}
      <div className="border-border bg-card shadow-card overflow-hidden rounded-xl border">
        <div className="border-border bg-muted/40 border-b px-5 py-3">
          <h2 className="text-foreground text-sm font-bold">
            {tabConfig.historyTitle({ count: String(currentMeta.total) })}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 border-border border-b">
              <TableHead className="text-muted-foreground text-[13px] font-bold tracking-wider whitespace-nowrap uppercase">
                {m.employee_detail_col_date()}
              </TableHead>
              {tab === 'PENALTI' && (
                <>
                  <TableHead className="text-muted-foreground text-[13px] font-bold tracking-wider whitespace-nowrap uppercase">
                    {m.employee_detail_col_level()}
                  </TableHead>
                  <TableHead className="text-muted-foreground text-[13px] font-bold tracking-wider whitespace-nowrap uppercase">
                    {m.employee_detail_col_kitta()}
                  </TableHead>
                </>
              )}
              <TableHead className="text-muted-foreground text-[13px] font-bold tracking-wider whitespace-nowrap uppercase">
                {m.employee_detail_col_team()}
              </TableHead>
              <TableHead className="text-muted-foreground text-[13px] font-bold tracking-wider whitespace-nowrap uppercase">
                {m.employee_detail_col_related_staff()}
              </TableHead>
              <TableHead className="text-muted-foreground text-[13px] font-bold tracking-wider whitespace-nowrap uppercase">
                {m.employee_detail_col_reason()}
              </TableHead>
              <TableHead className="text-muted-foreground text-[13px] font-bold tracking-wider whitespace-nowrap uppercase">
                {m.employee_detail_col_screenshot()}
              </TableHead>
              <TableHead className="text-muted-foreground text-[13px] font-bold tracking-wider whitespace-nowrap uppercase">
                {m.employee_detail_col_month()}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/50 border-b">
                  {Array.from({ length: tab === 'PENALTI' ? 8 : 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="bg-primary/8 h-4 w-24 animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : currentPoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tab === 'PENALTI' ? 8 : 6} className="py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="bg-primary/8 flex h-14 w-14 items-center justify-center rounded-full">
                      <Star className="text-primary/50 h-6 w-6" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                      {tabConfig.emptyText()}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentPoints.map((point) => (
                <TableRow
                  key={point.id}
                  className="border-border/50 hover:bg-muted/40 border-b transition-colors"
                >
                  <TableCell className="text-foreground text-sm">
                    {formatDate(point.createdAt)}
                  </TableCell>
                  {tab === 'PENALTI' && (
                    <>
                      <TableCell className="text-destructive text-sm font-semibold">
                        {point.points}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {point.kittaComponent ?? '-'}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-muted-foreground text-sm">
                    {employee.teamName ?? '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {point.relatedStaff ?? '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate text-sm">
                    {point.reason}
                  </TableCell>
                  <TableCell>
                    {point.screenshotUrl ? (
                      <a
                        href={point.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                      >
                        {m.employee_detail_view()}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground/40 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatMonthYear(point.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-border bg-muted/40 flex items-center justify-between border-t px-4 py-3">
            <p className="text-muted-foreground text-[13px] font-medium">
              {m.employee_detail_page_of({ page: String(page), total: String(totalPages) })}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="border-border text-primary hover:bg-primary/8 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="border-border text-primary hover:bg-primary/8 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
