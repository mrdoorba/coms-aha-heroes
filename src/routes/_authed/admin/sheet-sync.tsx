import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RefreshCw, Shield, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { getSyncStatusFn, listSyncJobsFn, triggerSyncFn } from '~/server/functions/sheet-sync'

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
    return { status: statusRes as SyncStatus, jobs: (jobsRes.jobs ?? []) as SyncJob[], meta: jobsRes.meta as Meta }
  },
  component: SheetSyncPage,
  pendingComponent: SheetSyncSkeleton,
})

function SheetSyncSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-muted" />
        <div className="space-y-1">
          <div className="h-5 w-28 rounded bg-muted" />
          <div className="h-3 w-44 rounded bg-muted" />
        </div>
      </div>
      <div className="h-28 rounded-xl border border-border bg-card" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl border border-border bg-card" />
        ))}
      </div>
    </div>
  )
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 text-[11px]">
          <CheckCircle2 className="h-3 w-3" />
          completed
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 text-[11px]">
          <XCircle className="h-3 w-3" />
          failed
        </Badge>
      )
    case 'in_progress':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 text-[11px]">
          <Loader2 className="h-3 w-3 animate-spin" />
          in progress
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 gap-1 text-[11px]">
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
  const entries = Array.isArray(job.errorLog)
    ? job.errorLog
    : job.errorLog
    ? [job.errorLog]
    : []

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-foreground">
            Job Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-muted-foreground">Status</p>
              <div className="mt-0.5">{getStatusBadge(job.status)}</div>
            </div>
            <div>
              <p className="text-muted-foreground">Direction</p>
              <p className="font-medium mt-0.5">{job.direction}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rows processed</p>
              <p className="font-medium mt-0.5">{job.rowsProcessed}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rows failed</p>
              <p className="font-medium mt-0.5 text-red-600">{job.rowsFailed}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Sheet</p>
              <p className="font-mono mt-0.5 break-all">{job.sheetName ?? job.sheetId}</p>
            </div>
          </div>

          {entries.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-1 font-medium">Error log</p>
              <pre className="max-h-64 overflow-auto rounded-lg bg-muted px-3 py-2 text-[10px] leading-relaxed whitespace-pre-wrap break-all">
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
  const [syncError, setSyncError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null)

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <Shield className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Admin access required to view this page.</p>
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

  async function handlePageChange(newPage: number) {
    setPage(newPage)
    await fetchData(newPage)
  }

  const { date: lastDate, time: lastTime } = formatTimestamp(status.lastJob?.completedAt ?? status.lastJob?.startedAt ?? null)

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <RefreshCw className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Sheet Sync</h1>
          <p className="text-xs text-muted-foreground">Manage Google Sheets synchronisation</p>
        </div>
      </div>

      {/* Status card */}
      <div className="rounded-xl border border-border bg-card shadow-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current status</span>
              {status.isRunning ? (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 text-[11px]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  running
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-[11px]">
                  idle
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
              <div>
                <p className="text-muted-foreground">Last sync</p>
                <p className="font-medium text-foreground">
                  {status.lastJob ? `${lastDate} ${lastTime}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last status</p>
                <div className="mt-0.5">
                  {status.lastJob ? getStatusBadge(status.lastJob.status) : <span className="text-muted-foreground">—</span>}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Scheduler</p>
                <p className="font-medium text-foreground">
                  {status.schedulerEnabled ? `Enabled (${formatInterval(status.intervalMs)})` : 'Disabled'}
                </p>
              </div>
              {status.lastJob && (
                <div>
                  <p className="text-muted-foreground">Last rows</p>
                  <p className="font-medium text-foreground">
                    {status.lastJob.rowsProcessed} processed
                    {status.lastJob.rowsFailed > 0 && (
                      <span className="text-red-500 ml-1">/ {status.lastJob.rowsFailed} failed</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={handleTriggerSync}
              disabled={isTriggeringSync || status.isRunning}
              className="bg-primary hover:bg-primary/80 text-primary-foreground h-9 px-5"
            >
              {isTriggeringSync ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Syncing…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Sync Now
                </>
              )}
            </Button>
            {syncError && (
              <p className="text-xs text-red-600 max-w-xs text-right">{syncError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Job history */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Sync History</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(page)}
            disabled={isLoading}
            className="h-8 px-3 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl border border-border bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border">
            <RefreshCw className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No sync jobs yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="text-xs font-semibold text-muted-foreground w-36">Started at</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Direction</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Sheet</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Rows</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const { date, time } = formatTimestamp(job.startedAt ?? job.createdAt)
                    return (
                      <TableRow key={job.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs">
                          <span className="block text-foreground font-medium">{date}</span>
                          <span className="block text-muted-foreground">{time}</span>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">{job.direction}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                          {job.sheetName ?? job.sheetId}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-xs">
                          <span className="text-foreground">{job.rowsProcessed}</span>
                          {job.rowsFailed > 0 && (
                            <span className="text-red-500 ml-1">/ {job.rowsFailed} failed</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setSelectedJob(job)}
                            className="text-xs text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
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
            <div className="md:hidden space-y-3">
              {jobs.map((job) => {
                const { date, time } = formatTimestamp(job.startedAt ?? job.createdAt)
                return (
                  <div key={job.id} className="rounded-xl border border-border bg-card shadow-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      {getStatusBadge(job.status)}
                      <span className="text-[10px] text-muted-foreground text-right">
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
                          {job.rowsFailed > 0 && <span className="text-red-500"> / {job.rowsFailed} failed</span>}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-0.5">Sheet</p>
                        <p className="font-mono text-[10px] truncate">{job.sheetName ?? job.sheetId}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="text-xs text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
                    >
                      View details
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
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
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
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
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Job detail dialog */}
      {selectedJob && (
        <ErrorLogDialog job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  )
}
