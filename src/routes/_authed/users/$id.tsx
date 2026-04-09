import { useState } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
import { ArrowLeft, User, Star, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { getEmployeeDetailFn } from '~/server/functions/employee-detail'
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

export const Route = createFileRoute('/_authed/users/$id')({
  beforeLoad: ({ context }) => {
    const role = context.session?.appUser?.role
    if (!role || !['admin', 'hr', 'leader'].includes(role)) {
      throw redirect({ to: '/dashboard' })
    }
  },
  loader: async ({ params }) => {
    const data = await getEmployeeDetailFn({ data: { userId: params.id } })
    return data
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

function EmployeeDetailPage() {
  const { employee, points, meta, monthlyChart, summary } = Route.useLoaderData()
  const [page, setPage] = useState(meta.page)
  const [currentPoints, setCurrentPoints] = useState(points)
  const [currentMeta, setCurrentMeta] = useState(meta)
  const [isLoading, setIsLoading] = useState(false)

  const totalPages = Math.ceil(currentMeta.total / currentMeta.limit)

  async function handlePageChange(newPage: number) {
    setIsLoading(true)
    try {
      const result = await getEmployeeDetailFn({
        data: { userId: employee.id, page: newPage, limit: currentMeta.limit },
      })
      setCurrentPoints(result.points)
      setCurrentMeta(result.meta)
      setPage(newPage)
    } finally {
      setIsLoading(false)
    }
  }

  const chartData = monthlyChart.map((item) => ({
    label: formatChartLabel(item.month),
    count: item.count,
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 page-transition">
      {/* Back + Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link to="/users">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-[#325FEC]/8 hover:text-[#325FEC]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#325FEC] to-[#759EEE] shadow-[0_4px_12px_rgba(50,95,236,0.25)]">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1D388B]">{employee.name}</h1>
            <p className="mt-0.5 text-[13px] font-medium text-[#1D388B]/50">
              {employee.teamName ?? '-'} &middot; {employee.department ?? '-'} &middot;{' '}
              {employee.position ?? '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#325FEC]/8 bg-white p-4 shadow-[0_2px_12px_rgba(29,56,139,0.07)]">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1D388B]/50">
            <Star className="h-4 w-4 text-yellow-500" />
            {m.employee_detail_poin_bintang()}
          </div>
          <div className="mt-1 text-2xl font-extrabold text-[#1D388B]">
            {summary.bintangCount}
          </div>
        </div>
        <div className="rounded-xl border border-[#325FEC]/8 bg-white p-4 shadow-[0_2px_12px_rgba(29,56,139,0.07)]">
          <div className="text-[13px] font-semibold text-[#1D388B]/50">
            {m.employee_detail_poin_aha()}
          </div>
          <div className="mt-1 text-2xl font-extrabold text-[#1D388B]">
            {summary.directPoinAha}
          </div>
        </div>
        <div className="rounded-xl border border-[#325FEC]/8 bg-white p-4 shadow-[0_2px_12px_rgba(29,56,139,0.07)]">
          <div className="text-[13px] font-semibold text-[#C73E3E]/70">
            {m.employee_detail_penalti()}
          </div>
          <div className="mt-1 text-2xl font-extrabold text-[#C73E3E]">
            {summary.penaltiPointsSum}
          </div>
        </div>
      </div>

      {/* Poin Bintang Chart */}
      {chartData.length > 0 && (
        <div className="mb-6 rounded-xl border border-[#325FEC]/8 bg-white p-5 shadow-[0_2px_12px_rgba(29,56,139,0.07)]">
          <h2 className="mb-4 text-sm font-bold text-[#1D388B]">
            {m.employee_detail_chart_title()}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#1D388B80' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#1D388B80' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill="#22C55E" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Points History Table */}
      <div className="rounded-xl border border-[#325FEC]/8 bg-white shadow-[0_2px_12px_rgba(29,56,139,0.07)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#325FEC]/8 bg-[#EDF1FA]/40">
          <h2 className="text-sm font-bold text-[#1D388B]">
            {m.employee_detail_history_title({ count: String(currentMeta.total) })}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#EDF1FA]/60 border-b border-[#325FEC]/8">
              <TableHead className="whitespace-nowrap text-[13px] font-bold uppercase tracking-wider text-[#1D388B]/60">
                {m.employee_detail_col_date()}
              </TableHead>
              <TableHead className="whitespace-nowrap text-[13px] font-bold uppercase tracking-wider text-[#1D388B]/60">
                {m.employee_detail_col_team()}
              </TableHead>
              <TableHead className="whitespace-nowrap text-[13px] font-bold uppercase tracking-wider text-[#1D388B]/60">
                {m.employee_detail_col_related_staff()}
              </TableHead>
              <TableHead className="whitespace-nowrap text-[13px] font-bold uppercase tracking-wider text-[#1D388B]/60">
                {m.employee_detail_col_reason()}
              </TableHead>
              <TableHead className="whitespace-nowrap text-[13px] font-bold uppercase tracking-wider text-[#1D388B]/60">
                {m.employee_detail_col_screenshot()}
              </TableHead>
              <TableHead className="whitespace-nowrap text-[13px] font-bold uppercase tracking-wider text-[#1D388B]/60">
                {m.employee_detail_col_month()}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-[#325FEC]/5">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-24 rounded bg-[#325FEC]/8 animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : currentPoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#325FEC]/8">
                      <Star className="h-6 w-6 text-[#325FEC]/50" />
                    </div>
                    <p className="text-sm font-medium text-[#1D388B]/60">
                      {m.employee_detail_empty()}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentPoints.map((point) => (
                <TableRow
                  key={point.id}
                  className="border-b border-[#325FEC]/5 hover:bg-[#EDF1FA]/40 transition-colors"
                >
                  <TableCell className="text-sm text-[#1D388B]">
                    {formatDate(point.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-[#1D388B]/70">
                    {employee.teamName ?? '-'}
                  </TableCell>
                  <TableCell className="text-sm text-[#1D388B]/70">
                    {point.relatedStaff ?? '-'}
                  </TableCell>
                  <TableCell className="text-sm text-[#1D388B]/70 max-w-[300px] truncate">
                    {point.reason}
                  </TableCell>
                  <TableCell>
                    {point.screenshotUrl ? (
                      <a
                        href={point.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[#325FEC] hover:underline"
                      >
                        {m.employee_detail_view()}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-sm text-[#1D388B]/40">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-[#1D388B]/70">
                    {formatMonthYear(point.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#325FEC]/8 bg-[#EDF1FA]/40 px-4 py-3">
            <p className="text-[13px] font-medium text-[#1D388B]/60">
              {m.employee_detail_page_of({ page: String(page), total: String(totalPages) })}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="border-[#325FEC]/15 text-[#325FEC] hover:bg-[#325FEC]/8 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="border-[#325FEC]/15 text-[#325FEC] hover:bg-[#325FEC]/8 disabled:opacity-40"
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
