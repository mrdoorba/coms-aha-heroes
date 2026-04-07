import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#325FEC]/10 shrink-0">
            <Users className="size-5 text-[#325FEC]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1D388B]">{m.nav_teams()}</h1>
            <p className="mt-0.5 text-sm font-medium text-[#1D388B]/50">
              {m.teams_total({ count: String(meta.total) })}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#325FEC] hover:bg-[#1D388B] text-white shadow-[0_2px_12px_rgba(50,95,236,0.30)] min-h-[44px] rounded-xl font-semibold transition-all duration-200"
        >
          <Plus className="size-4" data-icon="inline-start" />
          {m.teams_create()}
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#325FEC]/40" />
          <Input
            placeholder={m.teams_search_placeholder()}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 rounded-xl border-[#325FEC]/15 focus-visible:ring-[#325FEC]/30"
          />
        </div>
      </div>

      {/* Team Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#325FEC]/8 bg-white shadow-[0_2px_12px_rgba(29,56,139,0.07)] p-5 space-y-3 animate-pulse"
            >
              <div className="h-5 w-32 rounded-lg bg-[#325FEC]/8" />
              <div className="h-4 w-24 rounded-lg bg-[#325FEC]/6" />
              <div className="h-4 w-20 rounded-lg bg-[#325FEC]/6" />
              <div className="h-8 w-full rounded-xl bg-[#325FEC]/5" />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#325FEC]/8">
            <Users className="h-8 w-8 text-[#325FEC]/40" />
          </div>
          <p className="font-semibold text-[#1D388B]/60">{m.teams_empty()}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="relative card-hover border-[#325FEC]/8 shadow-[0_2px_12px_rgba(29,56,139,0.07)] rounded-2xl bg-white overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-[#1D388B]">
                    {team.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-lg hover:bg-[#325FEC]/8 hover:text-[#325FEC] min-h-[36px] min-w-[36px]"
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
                  <span className="font-medium text-foreground/70">
                    {team.leaderId
                      ? userMap.get(team.leaderId) ?? m.common_unknown()
                      : m.teams_no_leader()}
                  </span>
                </div>

                {/* Member count */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-[#325FEC]" />
                  <span className="font-medium text-foreground/70">
                    {m.teams_members({ count: String(team.memberCount) })}
                  </span>
                </div>

                {/* Expand/collapse members */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs font-semibold text-[#325FEC]/70 hover:text-[#325FEC] hover:bg-[#325FEC]/6 rounded-xl min-h-[36px]"
                  onClick={() => handleToggleMembers(team.id)}
                >
                  {expandedTeamId === team.id ? m.teams_hide_members() : m.teams_view_members()}
                  {expandedTeamId === team.id ? (
                    <ChevronUp className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </Button>

                {/* Expanded members list */}
                {expandedTeamId === team.id && (
                  <div className="border-t border-[#325FEC]/8 pt-3 mt-1">
                    {loadingMembers ? (
                      <div className="space-y-2 py-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-8 rounded-lg bg-[#325FEC]/6 animate-pulse" />
                        ))}
                      </div>
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
          <p className="text-sm font-semibold text-[#1D388B]/50">
            {m.common_page_of({ page: String(page), total: String(totalPages) })}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="rounded-xl border-[#325FEC]/15 hover:bg-[#325FEC]/6 hover:text-[#325FEC] min-h-[36px] min-w-[36px]"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="rounded-xl border-[#325FEC]/15 hover:bg-[#325FEC]/6 hover:text-[#325FEC] min-h-[36px] min-w-[36px]"
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
