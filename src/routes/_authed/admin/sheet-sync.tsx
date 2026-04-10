import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  RefreshCw,
  Shield,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import {
  getSyncStatusFn,
  listSyncJobsFn,
  triggerSyncFn,
  triggerResyncFn,
} from '~/server/functions/sheet-sync'

type SyncJob = {
  id: string
  direction: string
  sheetId: string
  sheetName: string | null
  status: string
  rowsProcessed: number
  rowsFailed: number
  errorLog: unknown
  startedBy: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

type SyncStatus = {
  isRunning: boolean
  lastJob: SyncJob | null
  schedulerEnabled: boolean
  intervalMs: number
}

type Meta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export const Route = createFileRoute('/_authed/admin/sheet-sync')({
  loader: async () => {
    const [statusRes, jobsRes] = await Promise.all([
      getSyncStatusFn(),
      listSyncJobsFn({ data: { page: 1, limit: 20 } }),
    ])
    return {
      status: statusRes as SyncStatus,
      jobs: (jobsRes.jobs ?? []) as SyncJob[],
      meta: jobsRes.meta as Meta,
    }
  },
  component: SheetSyncPage,
  pendingComponent: SheetSyncSkeleton,
})

function SheetSyncSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-6 p-4">
      <div className="flex items-center gap-3">
        <div className="bg-muted h-9 w-9 rounded-xl" />
        <div className="space-y-1">
          <div className="bg-muted h-5 w-28 rounded" />
          <div className="bg-muted h-3 w-44 rounded" />
        </div>
      </div>
      <div className="border-border bg-card h-28 rounded-xl border" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-border bg-card h-14 rounded-xl border" />
        ))}
      </div>
    </div>
  )
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-green-200 bg-green-50 text-[11px] text-green-700"
        >
          <CheckCircle2 className="h-3 w-3" />
          completed
        </Badge>
      )
    case 'failed':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-red-200 bg-red-50 text-[11px] text-red-700"
        >
          <XCircle className="h-3 w-3" />
          failed
        </Badge>
      )
    case 'in_progress':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-yellow-200 bg-yellow-50 text-[11px] text-yellow-700"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          in progress
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className="gap-1 border-gray-200 bg-gray-100 text-[11px] text-gray-600"
        >
          <Clock className="h-3 w-3" />
          {status}
        </Badge>
      )
  }
}

function formatTimestamp(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '—', time: '' }
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  }
}

function formatInterval(ms: number): string {
  const hours = ms / 1_000 / 60 / 60
  if (hours === 1) return 'every hour'
  if (Number.isInteger(hours)) return `every ${hours} hours`
  const minutes = ms / 1_000 / 60
  return `every ${minutes} minutes`
}

function ErrorLogDialog({ job, onClose }: { job: SyncJob; onClose: () => void }) {
  const entries = Array.isArray(job.errorLog) ? job.errorLog : job.errorLog ? [job.errorLog] : []

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground text-sm font-semibold">Job Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-muted-foreground">Status</p>
              <div className="mt-0.5">{getStatusBadge(job.status)}</div>
            </div>
            <div>
              <p className="text-muted-foreground">Direction</p>
              <p className="mt-0.5 font-medium">{job.direction}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rows processed</p>
              <p className="mt-0.5 font-medium">{job.rowsProcessed}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rows failed</p>
              <p className="mt-0.5 font-medium text-red-600">{job.rowsFailed}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Sheet</p>
              <p className="mt-0.5 font-mono break-all">{job.sheetName ?? job.sheetId}</p>
            </div>
          </div>

          {entries.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-1 font-medium">Error log</p>
              <pre className="bg-muted max-h-64 overflow-auto rounded-lg px-3 py-2 text-[10px] leading-relaxed break-all whitespace-pre-wrap">
                {JSON.stringify(entries, null, 2)}
              </pre>
            </div>
          )}

          {entries.length === 0 && (
            <p className="text-muted-foreground italic">No error entries.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SheetSyncPage() {
  const initialData = Route.useLoaderData()
  const { session } = Route.useRouteContext()

  const role = session?.appUser?.role ?? 'employee'

  const [status, setStatus] = useState<SyncStatus>(initialData.status)
  const [jobs, setJobs] = useState<SyncJob[]>(initialData.jobs)
  const [meta, setMeta] = useState<Meta>(initialData.meta)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isTriggeringSync, setIsTriggeringSync] = useState(false)
  const [isTriggeringResync, setIsTriggeringResync] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null)

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <Shield className="text-muted-foreground/40 mb-3 h-12 w-12" />
        <h2 className="text-foreground text-lg font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Admin access required to view this page.
        </p>
      </div>
    )
  }

  async function fetchData(newPage: number) {
    setIsLoading(true)
    try {
      const [statusRes, jobsRes] = await Promise.all([
        getSyncStatusFn(),
        listSyncJobsFn({ data: { page: newPage, limit: 20 } }),
      ])
      setStatus(statusRes as SyncStatus)
      setJobs((jobsRes.jobs ?? []) as SyncJob[])
      setMeta(jobsRes.meta as Meta)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTriggerSync() {
    setSyncError(null)
    setIsTriggeringSync(true)
    try {
      await triggerSyncFn()
      setPage(1)
      await fetchData(1)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to trigger sync')
    } finally {
      setIsTriggeringSync(false)
    }
  }

  async function handleResync() {
    if (
      !confirm(
        'This will DELETE all points, redemptions, and summaries, then re-import from the sheet. Continue?',
      )
    )
      return
    setSyncError(null)
    setIsTriggeringResync(true)
    try {
      await triggerResyncFn()
      setPage(1)
      await fetchData(1)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to trigger resync')
    } finally {
      setIsTriggeringResync(false)
    }
  }

  async function handlePageChange(newPage: number) {
    setPage(newPage)
    await fetchData(newPage)
  }

  const { date: lastDate, time: lastTime } = formatTimestamp(
    status.lastJob?.completedAt ?? status.lastJob?.startedAt ?? null,
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl">
          <RefreshCw className="text-foreground h-5 w-5" />
        </div>
        <div>
          <h1 className="text-foreground text-xl font-bold">Sheet Sync</h1>
          <p className="text-muted-foreground text-xs">Manage Google Sheets synchronisation</p>
        </div>
      </div>

      {/* Status card */}
      <div className="border-border bg-card shadow-card space-y-4 rounded-xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Current status
              </span>
              {status.isRunning ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-yellow-200 bg-yellow-50 text-[11px] text-yellow-700"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  running
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-gray-200 bg-gray-100 text-[11px] text-gray-600"
                >
                  idle
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
              <div>
                <p className="text-muted-foreground">Last sync</p>
                <p className="text-foreground font-medium">
                  {status.lastJob ? `${lastDate} ${lastTime}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last status</p>
                <div className="mt-0.5">
                  {status.lastJob ? (
                    getStatusBadge(status.lastJob.status)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Scheduler</p>
                <p className="text-foreground font-medium">
                  {status.schedulerEnabled
                    ? `Enabled (${formatInterval(status.intervalMs)})`
                    : 'Disabled'}
                </p>
              </div>
              {status.lastJob && (
                <div>
                  <p className="text-muted-foreground">Last rows</p>
                  <p className="text-foreground font-medium">
                    {status.lastJob.rowsProcessed} processed
                    {status.lastJob.rowsFailed > 0 && (
                      <span className="ml-1 text-red-500">
                        / {status.lastJob.rowsFailed} failed
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Button
                onClick={handleTriggerSync}
                disabled={isTriggeringSync || isTriggeringResync || status.isRunning}
                className="bg-primary hover:bg-primary/80 text-primary-foreground h-9 px-5"
              >
                {isTriggeringSync ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Syncing…
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
              <Button
                onClick={handleResync}
                disabled={isTriggeringSync || isTriggeringResync || status.isRunning}
                variant="destructive"
                className="h-9 px-5"
              >
                {isTriggeringResync ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Resyncing…
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                    Full Resync
                  </>
                )}
              </Button>
            </div>
            {syncError && <p className="max-w-xs text-right text-xs text-red-600">{syncError}</p>}
          </div>
        </div>
      </div>

      {/* Job history */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-sm font-semibold">Sync History</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(page)}
            disabled={isLoading}
            className="h-8 gap-1.5 px-3 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="border-border bg-muted/50 h-14 animate-pulse rounded-xl border"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="border-border flex flex-col items-center justify-center rounded-xl border py-16 text-center">
            <RefreshCw className="text-muted-foreground/30 mb-3 h-10 w-10" />
            <p className="text-muted-foreground text-sm">No sync jobs yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="border-border shadow-card hidden overflow-hidden rounded-xl border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="text-muted-foreground w-36 text-xs font-semibold">
                      Started at
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold">
                      Direction
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold">
                      Sheet
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold">
                      Rows
                    </TableHead>
                    <TableHead className="text-muted-foreground w-20 text-xs font-semibold" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const { date, time } = formatTimestamp(job.startedAt ?? job.createdAt)
                    return (
                      <TableRow key={job.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs">
                          <span className="text-foreground block font-medium">{date}</span>
                          <span className="text-muted-foreground block">{time}</span>
                        </TableCell>
                        <TableCell className="text-foreground text-xs font-medium">
                          {job.direction}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[140px] truncate text-xs">
                          {job.sheetName ?? job.sheetId}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-xs">
                          <span className="text-foreground">{job.rowsProcessed}</span>
                          {job.rowsFailed > 0 && (
                            <span className="ml-1 text-red-500">/ {job.rowsFailed} failed</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setSelectedJob(job)}
                            className="text-primary hover:text-primary/70 text-xs underline underline-offset-2 transition-colors"
                          >
                            Details
                          </button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {jobs.map((job) => {
                const { date, time } = formatTimestamp(job.startedAt ?? job.createdAt)
                return (
                  <div
                    key={job.id}
                    className="border-border bg-card shadow-card space-y-3 rounded-xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      {getStatusBadge(job.status)}
                      <span className="text-muted-foreground text-right text-[10px]">
                        {date} {time}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Direction</p>
                        <p className="font-medium">{job.direction}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Rows</p>
                        <p className="font-medium">
                          {job.rowsProcessed}
                          {job.rowsFailed > 0 && (
                            <span className="text-red-500"> / {job.rowsFailed} failed</span>
                          )}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-0.5">Sheet</p>
                        <p className="truncate font-mono text-[10px]">
                          {job.sheetName ?? job.sheetId}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="text-primary hover:text-primary/70 text-xs underline underline-offset-2 transition-colors"
                    >
                      View details
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-muted-foreground text-xs">
                Page {meta.page} of {meta.totalPages} &middot; {meta.total} jobs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => handlePageChange(page - 1)}
                  className="h-8 px-3"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages || isLoading}
                  onClick={() => handlePageChange(page + 1)}
                  className="h-8 px-3"
                >
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Job detail dialog */}
      {selectedJob && <ErrorLogDialog job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  )
}
