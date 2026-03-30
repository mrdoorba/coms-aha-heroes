import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
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
} from '~/server/functions/users'
import { USER_ROLES, ROLE_LABELS } from '~/shared/constants'
import type { UserRole } from '~/shared/constants'
import type { CreateUserInput, UpdateUserInput } from '~/shared/schemas/users'

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
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function fetchUsers(params?: {
    page?: number
    search?: string
    role?: string
    isActive?: string
  }) {
    const p = params?.page ?? page
    const s = params?.search ?? search
    const r = params?.role ?? roleFilter
    const a = params?.isActive ?? activeFilter

    setIsLoading(true)
    try {
      const result = await listUsersFn({
        data: {
          page: p,
          limit: 20,
          search: s || undefined,
          role: r || undefined,
          isActive: a === '' ? undefined : a === 'true',
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

  const teamMap = new Map(lookupData.teams.map((t) => [t.id, t.name]))

  const columns = [
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
        <div>
          <div className="font-medium text-gray-900">{info.getValue()}</div>
          <div className="text-xs text-gray-500">{info.row.original.email}</div>
        </div>
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
          <span className="text-gray-600">
            {tid ? teamMap.get(tid) ?? '-' : '-'}
          </span>
        )
      },
    }),
    columnHelper.accessor('department', {
      header: () => m.users_col_department(),
      cell: (info) => (
        <span className="text-gray-600">{info.getValue() ?? '-'}</span>
      ),
    }),
    columnHelper.accessor('isActive', {
      header: () => m.users_col_status(),
      cell: (info) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            info.getValue()
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1D388B]">{m.nav_users()}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {m.users_total({ count: String(meta.total) })}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" data-icon="inline-start" />
          {m.users_add()}
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
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

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
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
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-gray-500">
                  {m.common_loading()}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-gray-500">
                  {m.users_empty()}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-gray-500">
              {m.common_page_of({ page: String(page), total: String(totalPages) })}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

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
