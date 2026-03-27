import { eq, count } from 'drizzle-orm'
import { teams } from '~/db/schema'
import type { DbClient } from './base'
import { getDb } from './base'

export type TeamRow = typeof teams.$inferSelect

export async function listTeams(
  opts: { page: number; limit: number },
  tx?: DbClient,
) {
  const db = getDb(tx)
  const offset = (opts.page - 1) * opts.limit

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(teams)
      .orderBy(teams.name)
      .limit(opts.limit)
      .offset(offset),
    db.select({ total: count() }).from(teams),
  ])

  return { rows, total }
}

export async function getTeamById(id: string, tx?: DbClient) {
  const db = getDb(tx)
  const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1)
  return team ?? null
}

export async function createTeam(
  data: typeof teams.$inferInsert,
  tx?: DbClient,
) {
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
  const [updated] = await db
    .update(teams)
    .set(data)
    .where(eq(teams.id, id))
    .returning()
  return updated ?? null
}
