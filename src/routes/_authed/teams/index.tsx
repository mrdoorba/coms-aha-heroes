import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Search,
  Plus,
  Pencil,
  Users,
  Crown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { CreateTeamDialog } from '~/components/teams/create-team-dialog'
import { EditTeamDialog } from '~/components/teams/edit-team-dialog'
import { TeamMembersList } from '~/components/teams/team-members-list'
import {
  listTeamsFn,
  getTeamByIdFn,
  getLookupDataFn,
  createTeamFn,
  updateTeamFn,
} from '~/server/functions/teams'
import { getLookupDataFn as getUserLookupDataFn } from '~/server/functions/users'
import type { CreateTeamInput, UpdateTeamInput } from '~/shared/schemas/teams'
import type { UserRole } from '~/shared/constants'

type TeamRow = {
  id: string
  name: string
  branchId: string
  leaderId: string | null
  memberCount: number
  createdAt: string
  updatedAt: string
}

type TeamMember = {
  id: string
  name: string
  email: string
  role: UserRole
  department: string | null
  position: string | null
}

export const Route = createFileRoute('/_authed/teams/')({
  loader: async () => {
    const [teamsData, lookupData, userLookupData] = await Promise.all([
      listTeamsFn({ data: { page: 1, limit: 20 } }),
      getLookupDataFn(),
      getUserLookupDataFn(),
    ])
    return { teamsData, lookupData, userLookupData }
  },
  component: TeamsPage,
})

function TeamsPage() {
  const { teamsData: initialData, lookupData, userLookupData } = Route.useLoaderData()

  const [teams, setTeams] = useState<TeamRow[]>(initialData.teams as TeamRow[])
  const [meta, setMeta] = useState(initialData.meta)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<TeamRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Expanded team members
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)
  const [expandedMembers, setExpandedMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const userMap = new Map(lookupData.users.map((u) => [u.id, u.name]))

  async function fetchTeams(params?: { page?: number; search?: string }) {
    const p = params?.page ?? page
    const s = params?.search ?? search

    setIsLoading(true)
    try {
      const result = await listTeamsFn({
        data: {
          page: p,
          limit: 20,
          search: s || undefined,
        },
      })
      setTeams(result.teams as TeamRow[])
      setMeta(result.meta)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
    fetchTeams({ page: 1, search: value })
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchTeams({ page: newPage })
  }

  async function handleToggleMembers(teamId: string) {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null)
      setExpandedMembers([])
      return
    }

    setLoadingMembers(true)
    setExpandedTeamId(teamId)
    try {
      const teamDetail = await getTeamByIdFn({ data: { id: teamId } })
      setExpandedMembers((teamDetail.members ?? []) as TeamMember[])
    } finally {
      setLoadingMembers(false)
    }
  }

  async function handleCreateTeam(data: CreateTeamInput) {
    setIsSubmitting(true)
    try {
      await createTeamFn({ data })
      setCreateOpen(false)
      await fetchTeams()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEditTeam(id: string, data: UpdateTeamInput) {
    setIsSubmitting(true)
    try {
      await updateTeamFn({ data: { id, ...data } })
      setEditOpen(false)
      setSelectedTeam(null)
      await fetchTeams()
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPages = Math.ceil(meta.total / meta.limit)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1D388B]">Teams</h1>
          <p className="mt-1 text-sm text-gray-500">
            {meta.total} team{meta.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" data-icon="inline-start" />
          Create Team
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Team Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : teams.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No teams found</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-[#1D388B]">
                    {team.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setSelectedTeam(team)
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Leader */}
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="size-4 text-[#F4C144]" />
                  <span className="text-gray-600">
                    {team.leaderId
                      ? userMap.get(team.leaderId) ?? 'Unknown'
                      : 'No leader assigned'}
                  </span>
                </div>

                {/* Member count */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-[#325FEC]" />
                  <span className="text-gray-600">
                    {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Expand/collapse members */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs text-gray-500"
                  onClick={() => handleToggleMembers(team.id)}
                >
                  {expandedTeamId === team.id ? 'Hide members' : 'View members'}
                  {expandedTeamId === team.id ? (
                    <ChevronUp className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </Button>

                {/* Expanded members list */}
                {expandedTeamId === team.id && (
                  <div className="border-t pt-2">
                    {loadingMembers ? (
                      <p className="py-2 text-center text-xs text-gray-400">
                        Loading members...
                      </p>
                    ) : (
                      <TeamMembersList members={expandedMembers} />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
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

      {/* Dialogs */}
      <CreateTeamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateTeam}
        branches={userLookupData.branches}
        users={lookupData.users}
        isSubmitting={isSubmitting}
      />
      <EditTeamDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEditTeam}
        team={selectedTeam}
        users={lookupData.users}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
