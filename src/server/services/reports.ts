import { eq, and, gte, lte, count, sum, sql } from 'drizzle-orm'
import { achievementPoints, pointCategories, users, teams } from '~/db/schema'
import { withRLS } from '../repositories/base'
import type { AuthUser } from '../middleware/auth'
import type { ReportsQueryInput } from '~/shared/schemas/reports'

type ServiceContext = {
  readonly actor: AuthUser
}

export type DashboardStats = {
  totalSubmissions: number
  byCategory: { name: string; count: number }[]
  byTeam: { name: string; total: number }[]
  overTime: { date: string; count: number }[]
}

export async function getDashboardStats(
  input: ReportsQueryInput,
  ctx: ServiceContext,
): Promise<DashboardStats> {
  if (ctx.actor.role !== 'admin' && ctx.actor.role !== 'hr') {
    throw new InsufficientRoleError()
  }

  return withRLS(ctx.actor, async (db) => {
    // Determine branchId filter: admin can pass branchId param, hr is scoped to own branch
    const branchId =
      ctx.actor.role === 'admin' ? (input.branchId ?? null) : ctx.actor.branchId

    const baseConditions = []
    if (branchId !== null) {
      baseConditions.push(eq(achievementPoints.branchId, branchId))
    }
    if (input.startDate) {
      baseConditions.push(gte(achievementPoints.createdAt, new Date(input.startDate)))
    }
    if (input.endDate) {
      baseConditions.push(lte(achievementPoints.createdAt, new Date(input.endDate)))
    }

    const baseWhere = baseConditions.length > 0 ? and(...baseConditions) : undefined

    // Run all 4 aggregation queries in parallel within the same transaction
    const [totalResult, categoryRows, teamRows, overTimeRows] = await Promise.all([
      // 1. Total submissions
      db.select({ total: count() }).from(achievementPoints).where(baseWhere),

      // 2. By category breakdown
      db
        .select({ name: pointCategories.defaultName, count: count() })
        .from(achievementPoints)
        .innerJoin(pointCategories, eq(achievementPoints.categoryId, pointCategories.id))
        .where(baseWhere)
        .groupBy(pointCategories.id, pointCategories.defaultName)
        .orderBy(pointCategories.defaultName),

      // 3. By team breakdown
      db
        .select({ name: teams.name, total: sum(achievementPoints.points) })
        .from(achievementPoints)
        .innerJoin(users, eq(achievementPoints.userId, users.id))
        .innerJoin(teams, eq(users.teamId, teams.id))
        .where(baseWhere)
        .groupBy(teams.id, teams.name)
        .orderBy(teams.name),

      // 4. Submissions over time (grouped by date)
      db
        .select({
          date: sql<string>`DATE(${achievementPoints.createdAt})`.as('date'),
          count: count(),
        })
        .from(achievementPoints)
        .where(baseWhere)
        .groupBy(sql`DATE(${achievementPoints.createdAt})`)
        .orderBy(sql`DATE(${achievementPoints.createdAt})`),
    ])

    const total = totalResult[0]?.total ?? 0

    return {
      totalSubmissions: Number(total ?? 0),
      byCategory: categoryRows.map((r) => ({ name: r.name, count: Number(r.count) })),
      byTeam: teamRows.map((r) => ({ name: r.name, total: Number(r.total ?? 0) })),
      overTime: overTimeRows.map((r) => ({
        date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
        count: Number(r.count),
      })),
    }
  })
}

export class InsufficientRoleError extends Error {
  constructor() {
    super('Insufficient role for this action')
    this.name = 'InsufficientRoleError'
  }
}
