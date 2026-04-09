import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Search, Plus, Pencil, Archive, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { UserRoleBadge } from '~/components/users/user-role-badge'
import { CreateUserDialog } from '~/components/users/create-user-dialog'
import { EditUserDialog } from '~/components/users/edit-user-dialog'
import { ArchiveUserDialog } from '~/components/users/archive-user-dialog'
import {
  listUsersFn,
  getLookupDataFn,
  createUserFn,
  updateUserFn,
  archiveUserFn,
  bulkToggleUsersFn,
} from '~/server/functions/users'
import { useBulkSelection } from '~/hooks/use-bulk-selection'
import { BulkCheckbox } from '~/components/bulk/bulk-checkbox'
import { BulkActionBar } from '~/components/bulk/bulk-action-bar'
import { USER_ROLES, ROLE_LABELS } from '~/shared/constants'
import type { UserRole } from '~/shared/constants'
import type { CreateUserInput, UpdateUserInput } from '~/shared/schemas/users'
import { Label } from '~/components/ui/label'
import { AdvancedFilters } from '~/components/filters/advanced-filters'

type UserRow = {
  id: string
  email: string
  name: string
  role: UserRole
  department: string | null
  position: string | null
  teamId: string | null
  branchId: string
  isActive: boolean
  canSubmitPoints: boolean
  createdAt: Date
}

export const Route = createFileRoute('/_authed/users/')({
  loader: async () => {
    const [usersData, lookupData] = await Promise.all([
      listUsersFn({ data: { page: 1, limit: 20 } }),
      getLookupDataFn(),
    ])
    return { usersData, lookupData }
  },
  component: UsersPage,
})

const columnHelper = createColumnHelper<UserRow>()

function UsersPage() {
  const { usersData: initialData, lookupData } = Route.useLoaderData()

  const [users, setUsers] = useState<UserRow[]>(initialData.users as UserRow[])
  const [meta, setMeta] = useState(initialData.meta)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [positionFilter, setPositionFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bulk = useBulkSelection()

  async function fetchUsers(params?: {
    page?: number
    search?: string
    role?: string
    isActive?: string
    department?: string
    position?: string
    branchId?: string
  }) {
    const p = params?.page ?? page
    const s = params?.search ?? search
    const r = params?.role ?? roleFilter
    const a = params?.isActive ?? activeFilter
    const dept = params?.department ?? departmentFilter
    const pos = params?.position ?? positionFilter
    const br = params?.branchId ?? branchFilter

    setIsLoading(true)
    try {
      const result = await listUsersFn({
        data: {
          page: p,
          limit: 20,
          search: s || undefined,
          role: r || undefined,
          isActive: a === '' ? undefined : a === 'true',
          department: dept || undefined,
          position: pos || undefined,
          branchId: br || undefined,
        },
      })
      setUsers(result.users as UserRow[])
      setMeta(result.meta)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
    fetchUsers({ page: 1, search: value })
  }

  function handleRoleChange(value: string | null) {
    const v = !value || value === 'all' ? '' : value
    setRoleFilter(v)
    setPage(1)
    fetchUsers({ page: 1, role: v })
  }

  function handleActiveChange(value: string | null) {
    const v = !value || value === 'all' ? '' : value
    setActiveFilter(v)
    setPage(1)
    fetchUsers({ page: 1, isActive: v })
  }

  function handleDepartmentChange(value: string) {
    setDepartmentFilter(value)
    setPage(1)
    fetchUsers({ page: 1, department: value })
  }

  function handlePositionChange(value: string) {
    setPositionFilter(value)
    setPage(1)
    fetchUsers({ page: 1, position: value })
  }

  function handleBranchChange(value: string | null) {
    const v = !value || value === 'all' ? '' : value
    setBranchFilter(v)
    setPage(1)
    fetchUsers({ page: 1, branchId: v })
  }

  function handleClearAdvanced() {
    setDepartmentFilter('')
    setPositionFilter('')
    setBranchFilter('')
    setPage(1)
    fetchUsers({ page: 1, department: '', position: '', branchId: '' })
  }

  const hasActiveAdvanced = !!(departmentFilter || positionFilter || branchFilter)

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchUsers({ page: newPage })
  }

  async function handleCreateUser(data: CreateUserInput) {
    setIsSubmitting(true)
    try {
      await createUserFn({ data })
      setCreateOpen(false)
      await fetchUsers()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEditUser(id: string, data: UpdateUserInput) {
    setIsSubmitting(true)
    try {
      await updateUserFn({ data: { id, ...data } })
      setEditOpen(false)
      setSelectedUser(null)
      await fetchUsers()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleArchiveUser(id: string) {
    setIsSubmitting(true)
    try {
      await archiveUserFn({ data: { id } })
      setArchiveOpen(false)
      setSelectedUser(null)
      await fetchUsers()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleBulkAction(action: 'archive' | 'activate') {
    try {
      await bulkToggleUsersFn({ data: { ids: [...bulk.selectedIds], action } })
      bulk.clearSelection()
      await fetchUsers()
    } catch (err) {
      // error handled by server function
    }
  }

  const teamMap = new Map(lookupData.teams.map((t) => [t.id, t.name]))

  const columns = [
    columnHelper.display({
      id: 'select',
      header: () => (
        <BulkCheckbox
          checked={bulk.isAllSelected(users.map((u) => u.id))}
          onChange={() => bulk.toggleAll(users.map((u) => u.id))}
        />
      ),
      cell: ({ row }) => (
        <BulkCheckbox
          checked={bulk.selectedIds.has(row.original.id)}
          onChange={() => bulk.toggleId(row.original.id)}
        />
      ),
      size: 40,
    }),
    columnHelper.display({
      id: 'avatar',
      header: '',
      cell: () => (
        <div className="flex size-8 items-center justify-center rounded-full bg-[#96ADF5]/20 text-[#325FEC]">
          <User className="size-4" />
        </div>
      ),
    }),
    columnHelper.accessor('name', {
      header: () => m.users_col_name(),
      cell: (info) => (
        <Link to="/users/$id" params={{ id: info.row.original.id }} className="block">
          <div className="font-semibold text-[#1D388B] hover:text-[#325FEC] transition-colors">
            {info.getValue()}
          </div>
          <div className="text-xs text-[#1D388B]/50">{info.row.original.email}</div>
        </Link>
      ),
    }),
    columnHelper.accessor('role', {
      header: () => m.users_col_role(),
      cell: (info) => <UserRoleBadge role={info.getValue()} />,
    }),
    columnHelper.accessor('teamId', {
      header: () => m.users_col_team(),
      cell: (info) => {
        const tid = info.getValue()
        return (
          <span className="text-[#1D388B]/60 text-sm">
            {tid ? teamMap.get(tid) ?? '-' : '-'}
          </span>
        )
      },
    }),
    columnHelper.accessor('department', {
      header: () => m.users_col_department(),
      cell: (info) => (
        <span className="text-[#1D388B]/60 text-sm">{info.getValue() ?? '-'}</span>
      ),
    }),
    columnHelper.accessor('isActive', {
      header: () => m.users_col_status(),
      cell: (info) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            info.getValue()
              ? 'bg-[#22C55E]/12 text-[#22C55E]'
              : 'bg-[#C73E3E]/10 text-[#C73E3E]'
          }`}
        >
          {info.getValue() ? m.status_active() : m.status_archived()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setSelectedUser(info.row.original)
              setEditOpen(true)
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          {info.row.original.isActive && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setSelectedUser(info.row.original)
                setArchiveOpen(true)
              }}
            >
              <Archive className="size-3.5" />
            </Button>
          )}
        </div>
      ),
    }),
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const totalPages = Math.ceil(meta.total / meta.limit)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 page-transition">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#325FEC] to-[#759EEE] shadow-[0_4px_12px_rgba(50,95,236,0.25)]">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1D388B]">{m.nav_users()}</h1>
            <p className="mt-0.5 text-[13px] font-medium text-[#1D388B]/50">
              {m.users_total({ count: String(meta.total) })}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="btn-gradient-blue shrink-0 text-white h-9 px-4 rounded-xl font-semibold shadow-[0_2px_8px_rgba(50,95,236,0.25)]"
        >
          <Plus className="size-4" data-icon="inline-start" />
          {m.users_add()}
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#325FEC]/8 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(29,56,139,0.07)] sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#325FEC]/50" />
          <Input
            placeholder={m.users_search_placeholder()}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter || 'all'} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={m.users_all_roles()} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{m.users_all_roles()}</SelectItem>
            {USER_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter || 'all'} onValueChange={handleActiveChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={m.users_all_status()} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{m.users_all_status()}</SelectItem>
            <SelectItem value="true">{m.status_active()}</SelectItem>
            <SelectItem value="false">{m.status_archived()}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      <div className="mb-4">
        <AdvancedFilters
          onClear={handleClearAdvanced}
          hasActiveFilters={hasActiveAdvanced}
          children={[
            {
              key: 'department',
              node: (
                <div className="space-y-1">
                  <Label className="text-xs">{m.filter_department()}</Label>
                  <Input
                    placeholder={m.filter_department_placeholder()}
                    value={departmentFilter}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              ),
            },
            {
              key: 'position',
              node: (
                <div className="space-y-1">
                  <Label className="text-xs">{m.filter_position()}</Label>
                  <Input
                    placeholder={m.filter_position_placeholder()}
                    value={positionFilter}
                    onChange={(e) => handlePositionChange(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              ),
            },
            {
              key: 'branch',
              node: (
                <div className="space-y-1">
                  <Label className="text-xs">{m.filter_branch()}</Label>
                  <Select value={branchFilter || 'all'} onValueChange={handleBranchChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={m.filter_all_branches()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{m.filter_all_branches()}</SelectItem>
                      {lookupData.branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#325FEC]/8 bg-white shadow-[0_2px_12px_rgba(29,56,139,0.07)] overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-[#EDF1FA]/60 border-b border-[#325FEC]/8">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap text-[13px] font-bold uppercase tracking-wider text-[#1D388B]/60">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-[#325FEC]/5">
                    <TableCell><div className="h-4 w-4 rounded bg-[#325FEC]/8 animate-pulse" /></TableCell>
                    <TableCell><div className="h-8 w-8 rounded-full bg-[#325FEC]/8 animate-pulse" /></TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 rounded bg-[#325FEC]/8 animate-pulse" />
                        <div className="h-3 w-24 rounded bg-[#325FEC]/5 animate-pulse" />
                      </div>
                    </TableCell>
                    <TableCell><div className="h-5 w-16 rounded-full bg-[#325FEC]/8 animate-pulse" /></TableCell>
                    <TableCell><div className="h-3.5 w-20 rounded bg-[#325FEC]/5 animate-pulse" /></TableCell>
                    <TableCell><div className="h-3.5 w-20 rounded bg-[#325FEC]/5 animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-14 rounded-full bg-[#325FEC]/8 animate-pulse" /></TableCell>
                    <TableCell><div className="h-6 w-12 rounded bg-[#325FEC]/5 animate-pulse" /></TableCell>
                  </TableRow>
                ))}
              </>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#325FEC]/8">
                      <User className="h-6 w-6 text-[#325FEC]/50" />
                    </div>
                    <p className="text-sm font-medium text-[#1D388B]/60">{m.users_empty()}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-[#325FEC]/5 hover:bg-[#EDF1FA]/40 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#325FEC]/8 bg-[#EDF1FA]/40 px-4 py-3">
            <p className="text-[13px] font-medium text-[#1D388B]/60">
              {m.common_page_of({ page: String(page), total: String(totalPages) })}
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

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        actions={[
          {
            label: m.bulk_archive_selected(),
            variant: 'destructive' as const,
            onClick: () => handleBulkAction('archive'),
          },
          {
            label: m.bulk_activate_selected(),
            variant: 'default' as const,
            onClick: () => handleBulkAction('activate'),
          },
        ]}
        onClear={bulk.clearSelection}
      />

      {/* Dialogs */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateUser}
        branches={lookupData.branches}
        teams={lookupData.teams}
        isSubmitting={isSubmitting}
      />
      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEditUser}
        user={selectedUser}
        teams={lookupData.teams}
        isSubmitting={isSubmitting}
      />
      <ArchiveUserDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onConfirm={handleArchiveUser}
        user={selectedUser}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
