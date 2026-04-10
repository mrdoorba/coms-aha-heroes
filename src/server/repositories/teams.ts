import { eq, count, ilike, and } from 'drizzle-orm'
import { teams, users, branches } from '~/db/schema'
import type { DbClient } from './base'
import { getDb } from './base'

export type TeamRow = typeof teams.$inferSelect

export async function listTeams(
  opts: { page: number; limit: number; search?: string },
  tx?: DbClient,
) {
  const db = getDb(tx)
  const offset = (opts.page - 1) * opts.limit
  const conditions = []

  if (opts.search) conditions.push(ilike(teams.name, `%${opts.search}%`))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: teams.id,
        name: teams.name,
        branchId: teams.branchId,
        leaderId: teams.leaderId,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        branchCode: branches.code,
      })
      .from(teams)
      .innerJoin(branches, eq(teams.branchId, branches.id))
      .where(where)
      .orderBy(teams.name)
      .limit(opts.limit)
      .offset(offset),
    db.select({ total: count() }).from(teams).where(where),
  ])

  return { rows, total }
}

export async function getTeamMembers(teamId: string, tx?: DbClient) {
  const db = getDb(tx)
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      department: users.department,
      position: users.position,
      isActive: users.isActive,
    })
    .from(users)
    .where(and(eq(users.teamId, teamId), eq(users.isActive, true)))
    .orderBy(users.name)
}

export async function getTeamMemberCount(teamId: string, tx?: DbClient) {
  const db = getDb(tx)
  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(and(eq(users.teamId, teamId), eq(users.isActive, true)))
  return total
}

export async function getTeamById(id: string, tx?: DbClient) {
  const db = getDb(tx)
  const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1)
  return team ?? null
}

export async function createTeam(data: typeof teams.$inferInsert, tx?: DbClient) {
  const db = getDb(tx)
  const [created] = await db.insert(teams).values(data).returning()
  return created
}

export async function updateTeam(
  id: string,
  data: Partial<typeof teams.$inferInsert>,
  tx?: DbClient,
) {
  const db = getDb(tx)
  const [updated] = await db.update(teams).set(data).where(eq(teams.id, id)).returning()
  return updated ?? null
}
