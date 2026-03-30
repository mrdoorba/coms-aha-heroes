import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
import { Gift } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
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
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  approved: {
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  rejected: {
    className: 'bg-red-100 text-red-700 border-red-200',
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
      <div className="h-6 w-32 rounded bg-muted" />
      <div className="flex gap-2 border-b border-border pb-2">
        <div className="h-8 w-28 rounded bg-muted" />
        <div className="h-8 w-36 rounded bg-muted" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-white" />
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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const bulk = useBulkSelection()

  async function loadTab(tab: Tab) {
    setIsLoading(true)
    try {
      const params =
        tab === 'mine'
          ? { mine: true }
          : { status: 'pending' as const }
      const data = await listRedemptionsFn({ data: params })
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
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold text-[#1D388B]">{m.redemptions_title()}</h1>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'mine'
              ? 'border-[#325FEC] text-[#325FEC]'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => handleTabChange('mine')}
        >
          {m.redemptions_my_requests()}
        </button>
        {isHrOrAdmin && (
          <button
            type="button"
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'pending'
                ? 'border-[#325FEC] text-[#325FEC]'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => handleTabChange('pending')}
          >
            {m.redemptions_pending_approval()}
          </button>
        )}
      </div>

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
              className="h-24 rounded-xl border border-border bg-muted/50 animate-pulse"
            />
          ))
        ) : redemptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Gift className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">{m.redemptions_empty()}</p>
          </div>
        ) : (
          redemptions.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border bg-white px-4 py-3',
                activeTab === 'pending' && bulk.selectedIds.has(item.id)
                  ? 'border-[#325FEC] bg-blue-50/30'
                  : 'border-border',
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
              <div className="shrink-0 h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {item.rewardImageUrl ? (
                  <img
                    src={item.rewardImageUrl}
                    alt={item.rewardName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Gift className="h-6 w-6 text-muted-foreground/60" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1D388B] leading-snug line-clamp-1">
                    {item.rewardName}
                  </p>
                  <RedemptionStatusBadge status={item.status} />
                </div>

                {activeTab === 'pending' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.redemptions_requested_by()}{' '}
                    <span className="font-medium text-foreground">{item.userName}</span>
                  </p>
                )}

                <p className="text-xs font-medium text-[#325FEC] mt-0.5">
                  {item.pointsSpent} {m.points_poin_aha()}
                </p>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </span>
                  {item.approverName && item.status !== 'pending' && (
                    <span className="text-xs text-muted-foreground">
                      · {item.status === 'approved' ? m.redemptions_approved_by() : m.redemptions_rejected_by()}{' '}
                      <span className="font-medium text-foreground">{item.approverName}</span>
                    </span>
                  )}
                  {item.rejectionReason && (
                    <span className="text-xs text-red-600 italic">
                      "{item.rejectionReason}"
                    </span>
                  )}
                </div>

                {/* HR/Admin actions for pending tab */}
                {activeTab === 'pending' && item.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                      disabled={isSubmitting}
                      onClick={() => handleApprove(item.id)}
                    >
                      {m.common_approve()}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#325FEC] resize-none"
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
              className="bg-red-600 hover:bg-red-700 text-white"
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
