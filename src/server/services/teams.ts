import * as teamsRepo from '../repositories/teams'
import { writeAuditLog } from './audit'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type {
  CreateTeamInput,
  UpdateTeamInput,
  ListTeamsInput,
} from '~/shared/schemas/teams'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
  readonly ipAddress?: string
}

export async function listTeams(input: ListTeamsInput, ctx: ServiceContext) {
  const { rows, total } = await teamsRepo.listTeams(
    {
      page: input.page,
      limit: input.limit,
      search: input.search,
    },
    ctx.tx,
  )

  // Enrich with member counts
  const teamsWithCounts = await Promise.all(
    rows.map(async (team) => {
      const memberCount = await teamsRepo.getTeamMemberCount(team.id, ctx.tx)
      return { ...team, memberCount }
    }),
  )

  return {
    teams: teamsWithCounts,
    meta: { total, page: input.page, limit: input.limit },
  }
}

export async function getTeamById(id: string, ctx: ServiceContext) {
  const team = await teamsRepo.getTeamById(id, ctx.tx)
  if (!team) {
    throw new TeamNotFoundError(id)
  }

  const members = await teamsRepo.getTeamMembers(id, ctx.tx)
  const memberCount = members.length

  return { ...team, members, memberCount }
}

export async function createTeam(input: CreateTeamInput, ctx: ServiceContext) {
  const created = await teamsRepo.createTeam(
    {
      name: input.name,
      branchId: input.branchId,
      leaderId: input.leaderId ?? null,
    },
    ctx.tx,
  )

  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'TEAM_CREATED',
      entityType: 'teams',
      entityId: created.id,
      newValue: { name: created.name, leaderId: created.leaderId },
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  return created
}

export async function updateTeam(
  id: string,
  input: UpdateTeamInput,
  ctx: ServiceContext,
) {
  const existing = await teamsRepo.getTeamById(id, ctx.tx)
  if (!existing) {
    throw new TeamNotFoundError(id)
  }

  const updated = await teamsRepo.updateTeam(id, input, ctx.tx)
  if (!updated) {
    throw new TeamNotFoundError(id)
  }

  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'TEAM_UPDATED',
      entityType: 'teams',
      entityId: id,
      oldValue: { name: existing.name, leaderId: existing.leaderId },
      newValue: input,
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  return updated
}

// Domain errors
export class TeamNotFoundError extends Error {
  constructor(id: string) {
    super(`Team not found: ${id}`)
    this.name = 'TeamNotFoundError'
  }
}
