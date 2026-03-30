import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
import { Shield, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { listAuditLogsFn } from '~/server/functions/audit-logs'

type AuditLog = {
  id: string
  createdAt: string
  action: string
  entityType: string | null
  entityId: string | null
  actorId: string | null
  actorName: string | null
  actorRole: string | null
  details: Record<string, unknown> | null
}

type Meta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

const ACTION_GROUP_VALUES = ['', 'POINT_', 'CHALLENGE_', 'APPEAL_', 'REDEMPTION_', 'USER_', 'TEAM_'] as const

function getActionBadgeClass(action: string): string {
  if (action.startsWith('POINT_SUBMITTED') || action.startsWith('POINT_APPROVED')) {
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }
  if (action.startsWith('POINT_REJECTED') || action.startsWith('POINT_REVOKED')) {
    return 'bg-red-100 text-red-700 border-red-200'
  }
  if (action.startsWith('CHALLENGE_') || action.startsWith('APPEAL_')) {
    return 'bg-purple-100 text-purple-700 border-purple-200'
  }
  if (action.startsWith('REDEMPTION_')) {
    return 'bg-green-100 text-green-700 border-green-200'
  }
  if (action.startsWith('USER_') || action.startsWith('TEAM_')) {
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

function getRoleBadgeClass(role: string | null): string {
  if (role === 'admin') return 'bg-[#1D388B]/10 text-[#1D388B] border-[#1D388B]/20'
  if (role === 'hr') return 'bg-[#325FEC]/10 text-[#325FEC] border-[#325FEC]/20'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

function formatTimestamp(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  }
}

function DetailsCell({ details }: { details: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false)
  if (!details || Object.keys(details).length === 0) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-[#325FEC] underline underline-offset-2 hover:text-[#1D388B] transition-colors"
      >
        {open ? m.audit_hide() : m.audit_show()}
      </button>
      {open && (
        <pre className="mt-1 max-w-xs overflow-auto rounded bg-muted px-2 py-1 text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_authed/admin/audit-log')({
  loader: async () => {
    const result = await listAuditLogsFn({ data: { page: 1, limit: 50 } })
    return result
  },
  component: AuditLogPage,
  pendingComponent: AuditLogSkeleton,
})

function AuditLogSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-muted" />
        <div className="space-y-1">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-3 w-44 rounded bg-muted" />
        </div>
      </div>
      <div className="h-32 rounded-xl border border-border bg-white" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl border border-border bg-white" />
        ))}
      </div>
    </div>
  )
}

function AuditLogPage() {
  const initialData = Route.useLoaderData()
  const { session } = Route.useRouteContext()

  const role = session?.appUser?.role ?? 'employee'

  const [logs, setLogs] = useState<AuditLog[]>((initialData.logs ?? []) as AuditLog[])
  const [meta, setMeta] = useState<Meta>((initialData.meta ?? { total: 0, page: 1, limit: 50, totalPages: 1 }) as Meta)
  const [isLoading, setIsLoading] = useState(false)

  // Filter state
  const [actionGroup, setActionGroup] = useState('')
  const [entityType, setEntityType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [actor, setActor] = useState('')
  const [page, setPage] = useState(1)

  if (role !== 'hr' && role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <Shield className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <h2 className="text-lg font-semibold text-[#1D388B]">{m.common_access_denied()}</h2>
        <p className="text-sm text-muted-foreground mt-1">{m.common_no_permission()}</p>
      </div>
    )
  }

  async function fetchLogs(opts?: {
    actionGroup?: string
    entityType?: string
    startDate?: string
    endDate?: string
    actor?: string
    page?: number
  }) {
    const ag = opts?.actionGroup ?? actionGroup
    const et = opts?.entityType ?? entityType
    const sd = opts?.startDate ?? startDate
    const ed = opts?.endDate ?? endDate
    const ac = opts?.actor ?? actor
    const pg = opts?.page ?? page

    setIsLoading(true)
    try {
      const result = await listAuditLogsFn({
        data: {
          page: pg,
          limit: 50,
          action: ag || undefined,
          entityType: et || undefined,
          startDate: sd || undefined,
          endDate: ed || undefined,
          actorId: ac || undefined,
        },
      })
      setLogs((result.logs ?? []) as AuditLog[])
      setMeta((result.meta ?? { total: 0, page: pg, limit: 50, totalPages: 1 }) as Meta)
    } finally {
      setIsLoading(false)
    }
  }

  function handleActionGroup(val: string) {
    setActionGroup(val)
    setPage(1)
    fetchLogs({ actionGroup: val, page: 1 })
  }

  function handleSearch() {
    setPage(1)
    fetchLogs({ page: 1 })
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchLogs({ page: newPage })
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D388B]/10">
          <Shield className="h-5 w-5 text-[#1D388B]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1D388B]">{m.audit_title()}</h1>
          <p className="text-xs text-muted-foreground">{m.audit_subtitle()}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {/* Action group pills */}
        <div className="flex flex-wrap gap-2">
          {ACTION_GROUP_VALUES.map((val) => {
            const label = val === '' ? m.audit_group_all()
              : val === 'POINT_' ? m.audit_group_points()
              : val === 'CHALLENGE_' ? m.audit_group_challenges()
              : val === 'APPEAL_' ? m.audit_group_appeals()
              : val === 'REDEMPTION_' ? m.audit_group_redemptions()
              : val === 'USER_' ? m.audit_group_users()
              : m.audit_group_teams()
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleActionGroup(val)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                  actionGroup === val
                    ? 'bg-[#325FEC] text-white border-[#325FEC]'
                    : 'bg-muted text-muted-foreground border-transparent hover:border-[#325FEC]/40 hover:text-[#325FEC]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Secondary filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={m.audit_actor_placeholder()}
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="h-9 pl-8 text-sm"
            />
          </div>
          <Input
            placeholder={m.audit_entity_type_placeholder()}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="h-9 text-sm"
          />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 text-sm"
            title="Start date"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 text-sm"
            title="End date"
          />
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-[#325FEC] hover:bg-[#1D388B] text-white h-9 px-5"
          >
            {isLoading ? m.common_loading() : m.audit_apply_filters()}
          </Button>
        </div>
      </div>

      {/* Table — desktop */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl border border-border bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Shield className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">{m.audit_empty()}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold text-muted-foreground w-36">{m.audit_col_timestamp()}</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">{m.audit_col_actor()}</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">{m.audit_col_action()}</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">{m.audit_col_entity_type()}</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">{m.audit_col_entity_id()}</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">{m.audit_col_details()}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const { date, time } = formatTimestamp(log.createdAt)
                  return (
                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs">
                        <span className="block text-foreground font-medium">{date}</span>
                        <span className="block text-muted-foreground">{time}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-foreground">
                            {log.actorName ?? log.actorId ?? '—'}
                          </span>
                          {log.actorRole && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 w-fit ${getRoleBadgeClass(log.actorRole)}`}
                            >
                              {log.actorRole}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 font-mono ${getActionBadgeClass(log.action)}`}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.entityType ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[100px] truncate">
                        {log.entityId ?? '—'}
                      </TableCell>
                      <TableCell>
                        <DetailsCell details={log.details} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {logs.map((log) => {
              const { date, time } = formatTimestamp(log.createdAt)
              return (
                <div key={log.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 font-mono shrink-0 ${getActionBadgeClass(log.action)}`}
                    >
                      {log.action}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground text-right">
                      {date} {time}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-0.5">{m.audit_col_actor()}</p>
                      <p className="font-medium text-foreground">{log.actorName ?? log.actorId ?? '—'}</p>
                      {log.actorRole && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 mt-1 ${getRoleBadgeClass(log.actorRole)}`}
                        >
                          {log.actorRole}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">{m.audit_entity_label()}</p>
                      <p className="font-medium text-foreground">{log.entityType ?? '—'}</p>
                      <p className="font-mono text-muted-foreground text-[10px] truncate">{log.entityId ?? '—'}</p>
                    </div>
                  </div>

                  <DetailsCell details={log.details} />
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {m.common_page_of({ page: String(meta.page), total: String(meta.totalPages) })} &middot; {m.audit_total({ total: String(meta.total) })}
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
                {m.common_previous()}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages || isLoading}
                onClick={() => handlePageChange(page + 1)}
                className="h-8 px-3"
              >
                {m.common_next()}
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
