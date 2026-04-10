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
  branchCode: string
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
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Users className="text-primary size-5" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold">{m.nav_teams()}</h1>
            <p className="text-muted-foreground mt-0.5 text-sm font-medium">
              {m.teams_total({ count: String(meta.total) })}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary hover:bg-primary/80 text-primary-foreground min-h-[44px] rounded-xl font-semibold shadow-[0_2px_12px_rgba(50,95,236,0.30)] transition-all duration-200"
        >
          <Plus className="size-4" data-icon="inline-start" />
          {m.teams_create()}
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="text-primary/40 absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder={m.teams_search_placeholder()}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border-border focus-visible:ring-primary/30 rounded-xl pl-9"
          />
        </div>
      </div>

      {/* Team Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-card shadow-card animate-pulse space-y-3 rounded-2xl border p-5"
            >
              <div className="bg-primary/8 h-5 w-32 rounded-lg" />
              <div className="bg-primary/6 h-4 w-24 rounded-lg" />
              <div className="bg-primary/6 h-4 w-20 rounded-lg" />
              <div className="bg-primary/5 h-8 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-primary/8 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <Users className="text-primary/40 h-8 w-8" />
          </div>
          <p className="text-muted-foreground font-semibold">{m.teams_empty()}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="card-hover border-border shadow-card bg-card relative overflow-hidden rounded-2xl"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-foreground text-lg">{team.name}</CardTitle>
                    <span
                      className="text-base leading-none"
                      title={team.branchCode === 'TH' ? 'Thailand' : 'Indonesia'}
                    >
                      {team.branchCode === 'TH' ? '\u{1F1F9}\u{1F1ED}' : '\u{1F1EE}\u{1F1E9}'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="hover:bg-primary/8 hover:text-primary min-h-[36px] min-w-[36px] rounded-lg"
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
                  <span className="text-foreground/70 font-medium">
                    {team.leaderId
                      ? (userMap.get(team.leaderId) ?? m.common_unknown())
                      : m.teams_no_leader()}
                  </span>
                </div>

                {/* Member count */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="text-primary size-4" />
                  <span className="text-foreground/70 font-medium">
                    {m.teams_members({ count: String(team.memberCount) })}
                  </span>
                </div>

                {/* Expand/collapse members */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary hover:bg-primary/6 min-h-[36px] w-full justify-between rounded-xl text-xs font-semibold"
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
                  <div className="border-border mt-1 border-t pt-3">
                    {loadingMembers ? (
                      <div className="space-y-2 py-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="bg-primary/6 h-8 animate-pulse rounded-lg" />
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
          <p className="text-muted-foreground text-sm font-semibold">
            {m.common_page_of({ page: String(page), total: String(totalPages) })}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="border-border hover:bg-primary/6 hover:text-primary min-h-[36px] min-w-[36px] rounded-xl"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="border-border hover:bg-primary/6 hover:text-primary min-h-[36px] min-w-[36px] rounded-xl"
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
