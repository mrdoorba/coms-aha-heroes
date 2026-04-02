import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Filter, Search } from 'lucide-react'
import * as m from '~/paraglide/messages'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { PointCard } from '~/components/points/point-card'
import { PointTypeSelector } from '~/components/points/point-type-selector'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { listPointsFn } from '~/server/functions/points'
import { POINT_STATUSES } from '~/shared/constants'
import type { PointCategoryCode, PointStatus, UserRole } from '~/shared/constants'
import { useBulkSelection } from '~/hooks/use-bulk-selection'
import { BulkCheckbox } from '~/components/bulk/bulk-checkbox'
import { BulkActionBar } from '~/components/bulk/bulk-action-bar'
import { bulkResolvePointsFn } from '~/server/functions/approval'
import { AdvancedFilters } from '~/components/filters/advanced-filters'

type PointRow = {
  id: string
  userId: string
  categoryId: string
  categoryCode: PointCategoryCode
  categoryName: string
  userName: string
  userEmail: string
  points: number
  reason: string
  status: PointStatus
  createdAt: string
}

type PointsSearch = {
  status?: string
  q?: string
}

export const Route = createFileRoute('/_authed/points/')({
  validateSearch: (search: Record<string, unknown>): PointsSearch => ({
    status: typeof search.status === 'string' ? search.status : undefined,
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  loader: async ({ deps }: { deps?: unknown }) => {
    const data = await listPointsFn({ data: { page: 1, limit: 20 } })
    return data
  },
  component: PointsPage,
})

function PointsPage() {
  const tabs: Array<{ label: string; value: PointCategoryCode | 'ALL' }> = [
    { label: m.points_tab_all(), value: 'ALL' },
    { label: m.points_tab_bintang(), value: 'BINTANG' },
    { label: m.points_tab_penalti(), value: 'PENALTI' },
    { label: m.points_tab_poin_aha(), value: 'POIN_AHA' },
  ]

  const initialData = Route.useLoaderData()
  const { status: searchStatus } = Route.useSearch()
  const { session } = Route.useRouteContext()
  const userRole = (session?.appUser?.role ?? 'employee') as UserRole

  const bulk = useBulkSelection()

  const initialStatus = searchStatus ?? ''
  const [points, setPoints] = useState<PointRow[]>(initialData.points as PointRow[])
  const [meta, setMeta] = useState(initialData.meta)
  const [activeTab, setActiveTab] = useState<PointCategoryCode | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [searchFilter, setSearchFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)

  useEffect(() => {
    if (initialStatus) {
      fetchPoints({ status: initialStatus, pg: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchPoints(opts?: {
    category?: PointCategoryCode | 'ALL'
    status?: string
    pg?: number
    search?: string
    dateFrom?: string
    dateTo?: string
  }) {
    const cat = opts?.category ?? activeTab
    const st = opts?.status ?? statusFilter
    const p = opts?.pg ?? page
    const s = opts?.search ?? searchFilter
    const df = opts?.dateFrom ?? dateFrom
    const dt = opts?.dateTo ?? dateTo

    setIsLoading(true)
    try {
      const data = await listPointsFn({
        data: {
          page: p,
          limit: 20,
          categoryCode: cat === 'ALL' ? undefined : cat,
          status: st || undefined,
          search: s || undefined,
          dateFrom: df || undefined,
          dateTo: dt || undefined,
        },
      })
      setPoints(data.points as PointRow[])
      setMeta(data.meta)
    } finally {
      setIsLoading(false)
    }
  }

  function handleTabChange(tab: PointCategoryCode | 'ALL') {
    setActiveTab(tab)
    setPage(1)
    bulk.clearSelection()
    fetchPoints({ category: tab, pg: 1 })
  }

  function handleStatusChange(val: string | null) {
    const status = !val || val === 'all' ? '' : val
    setStatusFilter(status)
    setPage(1)
    bulk.clearSelection()
    fetchPoints({ status, pg: 1 })
  }

  async function handleBulkAction(action: 'approve' | 'reject', reason?: string) {
    try {
      await bulkResolvePointsFn({
        data: { ids: [...bulk.selectedIds], action, reason },
      })
      bulk.clearSelection()
      fetchPoints({ pg: page })
    } catch {
      // error handled by server function
    }
  }

  function handleSearchChange(value: string) {
    setSearchFilter(value)
    setPage(1)
    fetchPoints({ search: value, pg: 1 })
  }

  function handleDateFromChange(value: string) {
    setDateFrom(value)
    setPage(1)
    fetchPoints({ dateFrom: value, pg: 1 })
  }

  function handleDateToChange(value: string) {
    setDateTo(value)
    setPage(1)
    fetchPoints({ dateTo: value, pg: 1 })
  }

  function handleClearAdvanced() {
    setSearchFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    fetchPoints({ search: '', dateFrom: '', dateTo: '', pg: 1 })
  }

  const hasActiveAdvanced = !!(searchFilter || dateFrom || dateTo)

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchPoints({ pg: newPage })
  }

  const totalPages = Math.ceil((meta?.total ?? 0) / (meta?.limit ?? 20))

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1D388B]">{m.nav_points()}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-[#1D388B] shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{m.points_all_status()}</SelectItem>
            {POINT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        onClear={handleClearAdvanced}
        hasActiveFilters={hasActiveAdvanced}
        children={[
          {
            key: 'search',
            node: (
              <div className="space-y-1">
                <Label className="text-xs">{m.common_search()}</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={m.filter_search_reason()}
                    value={searchFilter}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'dateRange',
            node: (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{m.filter_date_from()}</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{m.filter_date_to()}</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* Point cards */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-border bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        ) : points.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">{m.points_empty()}</p>
          </div>
        ) : (
          <>
            {userRole !== 'employee' && (() => {
              const pendingIds = points.filter((p) => p.status === 'pending').map((p) => p.id)
              if (pendingIds.length === 0) return null
              return (
                <div className="flex items-center gap-2 px-1 pb-1">
                  <BulkCheckbox
                    checked={bulk.isAllSelected(pendingIds)}
                    indeterminate={bulk.selectedCount > 0 && !bulk.isAllSelected(pendingIds)}
                    onChange={() => bulk.toggleAll(pendingIds)}
                  />
                  <span className="text-sm text-muted-foreground">{m.bulk_select_all()}</span>
                </div>
              )
            })()}
            {points.map((point) => (
              <div
                key={point.id}
                className={`flex items-start gap-2 rounded-xl transition-colors ${
                  bulk.selectedIds.has(point.id) ? 'ring-2 ring-[#325FEC]' : ''
                }`}
              >
                {userRole !== 'employee' && point.status === 'pending' && (
                  <div className="flex items-center pt-5 pl-1">
                    <BulkCheckbox
                      checked={bulk.selectedIds.has(point.id)}
                      onChange={() => bulk.toggleId(point.id)}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <PointCard
                    id={point.id}
                    categoryCode={point.categoryCode}
                    userName={point.userName}
                    reason={point.reason}
                    points={point.points}
                    status={point.status}
                    createdAt={point.createdAt}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {userRole !== 'employee' && (
        <BulkActionBar
          selectedCount={bulk.selectedCount}
          actions={[
            {
              label: m.bulk_approve_selected(),
              variant: 'default' as const,
              onClick: () => handleBulkAction('approve'),
            },
            {
              label: m.bulk_reject_selected(),
              variant: 'destructive' as const,
              onClick: () => handleBulkAction('reject'),
              requiresReason: true,
            },
          ]}
          onClear={bulk.clearSelection}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            {m.common_previous()}
          </Button>
          <span className="text-sm text-muted-foreground">
            {m.common_page_of({ page: String(page), total: String(totalPages) })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            {m.common_next()}
          </Button>
        </div>
      )}

      {/* FAB */}
      <Button
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:bottom-8 md:right-8 bg-[#325FEC] hover:bg-[#1D388B]"
        size="icon"
        onClick={() => setShowTypeSelector(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Type selector dialog */}
      <Dialog open={showTypeSelector} onOpenChange={setShowTypeSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{m.points_submit()}</DialogTitle>
          </DialogHeader>
          <PointTypeSelector
            userRole={userRole}
            className="mt-2"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}