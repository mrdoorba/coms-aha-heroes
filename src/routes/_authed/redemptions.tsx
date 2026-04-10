import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
import { Gift, Search } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog'
import { cn } from '~/lib/utils'
import {
  listRedemptionsFn,
  approveRedemptionFn,
  rejectRedemptionFn,
  bulkResolveRedemptionsFn,
} from '~/server/functions/redemptions'
import { useBulkSelection } from '~/hooks/use-bulk-selection'
import { BulkCheckbox } from '~/components/bulk/bulk-checkbox'
import { BulkActionBar } from '~/components/bulk/bulk-action-bar'
import { AdvancedFilters } from '~/components/filters/advanced-filters'

type RedemptionRow = {
  id: string
  userId: string
  userName: string
  rewardId: string
  rewardName: string
  rewardImageUrl: string | null
  pointsSpent: number
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason: string | null
  approverName: string | null
  createdAt: string
  resolvedAt: string | null
}

type Tab = 'mine' | 'pending'

const redemptionStatusConfig: Record<
  'pending' | 'approved' | 'rejected',
  { className: string }
> = {
  pending: {
    className: 'bg-[#F4C144]/15 text-[#a07700] border-[#F4C144]/30 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/40',
  },
  approved: {
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
  },
  rejected: {
    className: 'bg-red-50 text-red-700 border-red-200/70 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50',
  },
}

function redemptionStatusLabel(status: 'pending' | 'approved' | 'rejected'): string {
  if (status === 'approved') return m.status_approved()
  if (status === 'rejected') return m.status_rejected()
  return m.status_pending()
}

function RedemptionStatusBadge({
  status,
  className,
}: {
  readonly status: 'pending' | 'approved' | 'rejected'
  readonly className?: string
}) {
  const config = redemptionStatusConfig[status]
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className, className)}
    >
      {redemptionStatusLabel(status)}
    </Badge>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const Route = createFileRoute('/_authed/redemptions')({
  loader: async () => {
    const data = await listRedemptionsFn({ data: { mine: true } })
    return data
  },
  component: RedemptionsPage,
  pendingComponent: RedemptionsSkeleton,
})

function RedemptionsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/8" />
        <div className="h-6 w-32 rounded bg-primary/8" />
      </div>
      <div className="flex gap-1.5 rounded-2xl border border-border bg-card p-1.5">
        <div className="h-10 flex-1 rounded-xl bg-primary/8" />
        <div className="h-10 flex-1 rounded-xl bg-primary/5" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card shadow-card" />
        ))}
      </div>
    </div>
  )
}

function RedemptionsPage() {
  const initialData = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const router = useRouter()

  const role = session?.appUser?.role ?? 'employee'
  const isHrOrAdmin = role === 'hr' || role === 'admin'

  const [activeTab, setActiveTab] = useState<Tab>('mine')
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>(
    (initialData.redemptions ?? []) as RedemptionRow[],
  )
  const [isLoading, setIsLoading] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const bulk = useBulkSelection()

  async function loadTab(tab: Tab, opts?: { search?: string; dateFrom?: string; dateTo?: string }) {
    const s = opts?.search ?? searchFilter
    const df = opts?.dateFrom ?? dateFrom
    const dt = opts?.dateTo ?? dateTo

    setIsLoading(true)
    try {
      const base =
        tab === 'mine'
          ? { mine: true }
          : { status: 'pending' as const }
      const data = await listRedemptionsFn({
        data: {
          ...base,
          search: s || undefined,
          dateFrom: df || undefined,
          dateTo: dt || undefined,
        },
      })
      setRedemptions((data.redemptions ?? []) as RedemptionRow[])
    } finally {
      setIsLoading(false)
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    bulk.clearSelection()
    loadTab(tab)
  }

  function handleSearchChange(value: string) {
    setSearchFilter(value)
    loadTab(activeTab, { search: value })
  }

  function handleDateFromChange(value: string) {
    setDateFrom(value)
    loadTab(activeTab, { dateFrom: value })
  }

  function handleDateToChange(value: string) {
    setDateTo(value)
    loadTab(activeTab, { dateTo: value })
  }

  function handleClearAdvanced() {
    setSearchFilter('')
    setDateFrom('')
    setDateTo('')
    loadTab(activeTab, { search: '', dateFrom: '', dateTo: '' })
  }

  const hasActiveAdvanced = !!(searchFilter || dateFrom || dateTo)

  async function handleBulkAction(action: 'approve' | 'reject', rejectionReason?: string) {
    setIsSubmitting(true)
    try {
      await bulkResolveRedemptionsFn({
        data: {
          ids: [...bulk.selectedIds],
          action,
          rejectionReason,
        },
      })
      bulk.clearSelection()
      await router.invalidate()
      await loadTab(activeTab)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleApprove(id: string) {
    setIsSubmitting(true)
    try {
      await approveRedemptionFn({ data: { id } })
      await router.invalidate()
      await loadTab(activeTab)
    } finally {
      setIsSubmitting(false)
    }
  }

  function openRejectDialog(id: string) {
    setSelectedId(id)
    setRejectionReason('')
    setRejectDialogOpen(true)
  }

  async function handleRejectConfirm() {
    if (!selectedId) return
    setIsSubmitting(true)
    try {
      await rejectRedemptionFn({
        data: { id: selectedId, rejectionReason: rejectionReason.trim() || undefined },
      })
      setRejectDialogOpen(false)
      setSelectedId(null)
      await router.invalidate()
      await loadTab(activeTab)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 page-transition">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F4C144] to-[#FFD97D] shadow-[0_4px_12px_rgba(244,193,68,0.25)]">
          <Gift className="h-5 w-5 text-[#7a5800]" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">{m.redemptions_title()}</h1>
          <p className="text-[13px] font-medium text-muted-foreground">{m.nav_redemptions?.() ?? 'Reward redemptions'}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5 rounded-2xl bg-card border border-border p-1.5 shadow-card">
        <button
          type="button"
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 min-h-[44px]',
            activeTab === 'mine'
              ? 'bg-gradient-to-br from-[#F4C144]/18 to-[#F4C144]/8 text-[#a07700] dark:text-yellow-300 shadow-[0_2px_8px_rgba(244,193,68,0.20)] border border-[#F4C144]/30'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => handleTabChange('mine')}
        >
          <Gift className="h-4 w-4" />
          {m.redemptions_my_requests()}
        </button>
        {isHrOrAdmin && (
          <button
            type="button"
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 min-h-[44px]',
              activeTab === 'pending'
                ? 'bg-gradient-to-br from-primary/18 to-primary/8 text-primary shadow-[0_2px_8px_rgba(50,95,236,0.20)] border border-primary/30'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => handleTabChange('pending')}
          >
            <Gift className="h-4 w-4" />
            {m.redemptions_pending_approval()}
          </button>
        )}
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
                    placeholder={m.filter_search_reward()}
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

      {/* Card list */}
      {activeTab === 'pending' && isHrOrAdmin && redemptions.length > 0 && !isLoading && (
        <div className="flex items-center gap-2 px-1">
          <BulkCheckbox
            checked={bulk.isAllSelected(redemptions.filter((r) => r.status === 'pending').map((r) => r.id))}
            onChange={() => bulk.toggleAll(redemptions.filter((r) => r.status === 'pending').map((r) => r.id))}
          />
          <span className="text-xs text-muted-foreground">{m.bulk_select_all()}</span>
        </div>
      )}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-border bg-card shadow-card animate-pulse"
            />
          ))
        ) : redemptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F4C144]/12">
              <Gift className="h-7 w-7 text-[#F4C144]" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{m.redemptions_empty()}</p>
          </div>
        ) : (
          redemptions.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border bg-card px-4 py-3 shadow-card transition-all duration-200',
                activeTab === 'pending' && bulk.selectedIds.has(item.id)
                  ? 'border-primary/40 bg-primary/5 shadow-[0_2px_12px_rgba(50,95,236,0.12)]'
                  : 'border-border hover:border-border hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]',
              )}
            >
              {activeTab === 'pending' && isHrOrAdmin && item.status === 'pending' && (
                <div className="shrink-0 pt-1">
                  <BulkCheckbox
                    checked={bulk.selectedIds.has(item.id)}
                    onChange={() => bulk.toggleId(item.id)}
                  />
                </div>
              )}
              {/* Thumbnail */}
              <div className="shrink-0 h-12 w-12 rounded-xl bg-primary/8 flex items-center justify-center overflow-hidden border border-border">
                {item.rewardImageUrl ? (
                  <img
                    src={item.rewardImageUrl}
                    alt={item.rewardName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Gift className="h-6 w-6 text-primary/50" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                    {item.rewardName}
                  </p>
                  <RedemptionStatusBadge status={item.status} />
                </div>

                {activeTab === 'pending' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.redemptions_requested_by()}{' '}
                    <span className="font-semibold text-foreground/80">{item.userName}</span>
                  </p>
                )}

                <p className="text-xs font-semibold text-primary mt-0.5">
                  {item.pointsSpent} {m.points_poin_aha()}
                </p>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground/60">
                    {formatDate(item.createdAt)}
                  </span>
                  {item.approverName && item.status !== 'pending' && (
                    <span className="text-xs text-muted-foreground/60">
                      · {item.status === 'approved' ? m.redemptions_approved_by() : m.redemptions_rejected_by()}{' '}
                      <span className="font-medium text-muted-foreground">{item.approverName}</span>
                    </span>
                  )}
                  {item.rejectionReason && (
                    <span className="text-xs text-destructive italic">
                      "{item.rejectionReason}"
                    </span>
                  )}
                </div>

                {/* HR/Admin actions for pending tab */}
                {activeTab === 'pending' && item.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs btn-gradient-blue text-white rounded-lg font-semibold"
                      disabled={isSubmitting}
                      onClick={() => handleApprove(item.id)}
                    >
                      {m.common_approve()}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs border-destructive/25 text-destructive hover:bg-destructive/8 rounded-lg font-semibold"
                      disabled={isSubmitting}
                      onClick={() => openRejectDialog(item.id)}
                    >
                      {m.common_reject()}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {activeTab === 'pending' && isHrOrAdmin && (
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

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{m.redemptions_reject_title()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium text-foreground" htmlFor="rejection-reason">
              {m.redemptions_reject_reason_label()}
            </label>
            <textarea
              id="rejection-reason"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              placeholder={m.redemptions_reject_placeholder()}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setRejectDialogOpen(false)}
            >
              {m.common_cancel()}
            </Button>
            <Button
              size="sm"
              className="btn-gradient-red text-white rounded-lg font-semibold"
              disabled={isSubmitting}
              onClick={handleRejectConfirm}
            >
              {isSubmitting ? m.redemptions_rejecting() : m.redemptions_confirm_reject()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
