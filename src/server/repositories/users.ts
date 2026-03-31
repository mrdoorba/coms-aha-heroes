import { eq, and, ilike, sql, count } from 'drizzle-orm'
import { users } from '~/db/schema'
import type { DbClient } from './base'
import { getDb } from './base'
import type { UserRole } from '~/shared/constants'

export type UserRow = typeof users.$inferSelect

type ListUsersOpts = {
  readonly page: number
  readonly limit: number
  readonly role?: UserRole
  readonly teamId?: string
  readonly search?: string
  readonly isActive?: boolean
  readonly department?: string
  readonly position?: string
  readonly branchId?: string
}

export async function listUsers(opts: ListUsersOpts, tx?: DbClient) {
  const db = getDb(tx)
  const conditions = []

  if (opts.role) conditions.push(eq(users.role, opts.role))
  if (opts.teamId) conditions.push(eq(users.teamId, opts.teamId))
  if (opts.isActive !== undefined) conditions.push(eq(users.isActive, opts.isActive))
  if (opts.search) conditions.push(ilike(users.name, `%${opts.search}%`))
  if (opts.department) conditions.push(ilike(users.department, `%${opts.department}%`))
  if (opts.position) conditions.push(ilike(users.position, `%${opts.position}%`))
  if (opts.branchId) conditions.push(eq(users.branchId, opts.branchId))

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const offset = (opts.page - 1) * opts.limit

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(users)
      .where(where)
      .orderBy(users.name)
      .limit(opts.limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(users)
      .where(where),
  ])

  return { rows, total }
}

export async function getUserById(id: string, tx?: DbClient) {
  const db = getDb(tx)
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user ?? null
}

export async function getUserByEmail(email: string, tx?: DbClient) {
  const db = getDb(tx)
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user ?? null
}

export async function createUser(
  data: typeof users.$inferInsert,
  tx?: DbClient,
) {
  const db = getDb(tx)
  const [created] = await db.insert(users).values(data).returning()
  return created
}

export async function updateUser(
  id: string,
  data: Partial<typeof users.$inferInsert>,
  tx?: DbClient,
) {
  const db = getDb(tx)
  const [updated] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning()
  return updated ?? null
}

export async function archiveUser(id: string, tx?: DbClient) {
  const db = getDb(tx)
  const [archived] = await db
    .update(users)
    .set({ isActive: false, archivedAt: sql`now()` })
    .where(eq(users.id, id))
    .returning()
  return archived ?? null
}

export async function activateUser(id: string, tx?: DbClient) {
  const db = getDb(tx)
  const [activated] = await db
    .update(users)
    .set({ isActive: true, archivedAt: null })
    .where(eq(users.id, id))
    .returning()
  return activated ?? null
}
