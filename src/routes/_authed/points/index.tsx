import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Filter } from 'lucide-react'
import { Button } from '~/components/ui/button'
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

export const Route = createFileRoute('/_authed/points/')({
  loader: async () => {
    const data = await listPointsFn({ data: { page: 1, limit: 20 } })
    return data
  },
  component: PointsPage,
})

const tabs: Array<{ label: string; value: PointCategoryCode | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Bintang', value: 'BINTANG' },
  { label: 'Penalti', value: 'PENALTI' },
  { label: 'Poin AHA', value: 'POIN_AHA' },
]

function PointsPage() {
  const initialData = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const userRole = (session?.appUser?.role ?? 'employee') as UserRole

  const [points, setPoints] = useState<PointRow[]>(initialData.points as PointRow[])
  const [meta, setMeta] = useState(initialData.meta)
  const [activeTab, setActiveTab] = useState<PointCategoryCode | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)

  async function fetchPoints(opts?: {
    category?: PointCategoryCode | 'ALL'
    status?: string
    pg?: number
  }) {
    const cat = opts?.category ?? activeTab
    const st = opts?.status ?? statusFilter
    const p = opts?.pg ?? page

    setIsLoading(true)
    try {
      const data = await listPointsFn({
        data: {
          page: p,
          limit: 20,
          categoryCode: cat === 'ALL' ? undefined : cat,
          status: st || undefined,
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
    fetchPoints({ category: tab, pg: 1 })
  }

  function handleStatusChange(val: string | null) {
    const status = !val || val === 'all' ? '' : val
    setStatusFilter(status)
    setPage(1)
    fetchPoints({ status, pg: 1 })
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchPoints({ pg: newPage })
  }

  const totalPages = Math.ceil((meta?.total ?? 0) / (meta?.limit ?? 20))

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1D388B]">Points</h1>
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
            <SelectItem value="all">All Status</SelectItem>
            {POINT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            <p className="text-muted-foreground">No points recorded yet</p>
          </div>
        ) : (
          points.map((point) => (
            <PointCard
              key={point.id}
              id={point.id}
              categoryCode={point.categoryCode}
              userName={point.userName}
              reason={point.reason}
              points={point.points}
              status={point.status}
              createdAt={point.createdAt}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
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
            <DialogTitle>Submit Points</DialogTitle>
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