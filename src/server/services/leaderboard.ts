import { eq, and, count, sql, desc, gte } from 'drizzle-orm'
import { pointSummaries, users, achievementPoints, pointCategories } from '~/db/schema'
import { withRLS } from '../repositories/base'
import { getPointImpactSettings } from './settings-cache'
import type { AuthUser } from '../middleware/auth'

type ServiceContext = {
  readonly actor: AuthUser
  readonly ipAddress?: string
}

export type LeaderboardInput = {
  type: 'bintang' | 'poin_aha'
  teamId?: string
  months?: number
  page: number
  limit: number
}

export type LeaderboardEntry = {
  rank: number
  userId: string
  name: string
  avatarUrl: string | null
  teamId: string | null
  score: number
  bintangCount: number
  penaltiCount: number
}

export async function getLeaderboard(
  input: LeaderboardInput,
  ctx: ServiceContext,
): Promise<{ entries: LeaderboardEntry[]; meta: { total: number; page: number; limit: number } }> {
  const { bintangPointImpact, penaltiPointImpact } = await getPointImpactSettings()

  // Time-filtered path: aggregate from achievement_points directly
  if (input.months) {
    return getLeaderboardFiltered(input, ctx, bintangPointImpact, penaltiPointImpact)
  }

  return withRLS(ctx.actor, async (db) => {
    const whereConditions = input.teamId
      ? and(
          eq(pointSummaries.branchId, ctx.actor.branchId),
          eq(users.isActive, true),
          eq(users.teamId, input.teamId),
        )
      : and(eq(pointSummaries.branchId, ctx.actor.branchId), eq(users.isActive, true))

    // Compute poinAhaBalance in SQL so we can ORDER BY and LIMIT/OFFSET in the DB
    const poinAhaBalanceExpr = sql<number>`(
      ${pointSummaries.directPoinAha}
      + ${pointSummaries.bintangCount} * ${bintangPointImpact}
      - ${pointSummaries.penaltiPointsSum} * ${penaltiPointImpact}
      - ${pointSummaries.redeemedTotal}
    )`.as('poin_aha_balance')

    const orderExpr =
      input.type === 'bintang' ? desc(pointSummaries.bintangCount) : desc(poinAhaBalanceExpr)

    const offset = (input.page - 1) * input.limit

    // Run count and paginated query in parallel
    const [countResult, rows] = await Promise.all([
      db
        .select({ total: count() })
        .from(pointSummaries)
        .innerJoin(users, eq(pointSummaries.userId, users.id))
        .where(whereConditions),

      db
        .select({
          userId: pointSummaries.userId,
          name: users.name,
          avatarUrl: users.avatarUrl,
          teamId: users.teamId,
          bintangCount: pointSummaries.bintangCount,
          penaltiPointsSum: pointSummaries.penaltiPointsSum,
          poinAhaBalance: poinAhaBalanceExpr,
        })
        .from(pointSummaries)
        .innerJoin(users, eq(pointSummaries.userId, users.id))
        .where(whereConditions)
        .orderBy(orderExpr)
        .limit(input.limit)
        .offset(offset),
    ])

    const total = Number(countResult[0]?.total ?? 0)

    const entries: LeaderboardEntry[] = rows.map((row, index) => ({
      rank: offset + index + 1,
      userId: row.userId,
      name: row.name,
      avatarUrl: row.avatarUrl,
      teamId: row.teamId,
      score: input.type === 'bintang' ? row.bintangCount : Number(row.poinAhaBalance ?? 0),
      bintangCount: row.bintangCount,
      penaltiCount: row.penaltiPointsSum,
    }))

    return {
      entries,
      meta: { total, page: input.page, limit: input.limit },
    }
  })
}

/**
 * Time-filtered leaderboard: aggregates directly from achievement_points
 * for a given date range instead of using pre-computed point_summaries.
 */
async function getLeaderboardFiltered(
  input: LeaderboardInput & { months: number },
  ctx: ServiceContext,
  bintangPointImpact: number,
  penaltiPointImpact: number,
): Promise<{ entries: LeaderboardEntry[]; meta: { total: number; page: number; limit: number } }> {
  return withRLS(ctx.actor, async (db) => {
    const sinceDate = sql`now() - make_interval(months => ${input.months})`

    const bintangCountExpr = sql<number>`COALESCE(COUNT(*) FILTER (
      WHERE ${pointCategories.code} = 'BINTANG' AND ${achievementPoints.status} = 'active'
    ), 0)`.as('bintang_count')

    const penaltiSumExpr = sql<number>`COALESCE(SUM(${achievementPoints.points}) FILTER (
      WHERE ${pointCategories.code} = 'PENALTI' AND ${achievementPoints.status} IN ('active', 'challenged')
    ), 0)`.as('penalti_sum')

    const directPoinAhaExpr = sql<number>`COALESCE(SUM(${achievementPoints.points}) FILTER (
      WHERE ${pointCategories.code} = 'POIN_AHA' AND ${achievementPoints.status} = 'active'
    ), 0)`.as('direct_poin_aha')

    const poinAhaBalanceExpr = sql<number>`(
      COALESCE(SUM(${achievementPoints.points}) FILTER (
        WHERE ${pointCategories.code} = 'POIN_AHA' AND ${achievementPoints.status} = 'active'
      ), 0)
      + COALESCE(COUNT(*) FILTER (
        WHERE ${pointCategories.code} = 'BINTANG' AND ${achievementPoints.status} = 'active'
      ), 0) * ${bintangPointImpact}
      - COALESCE(SUM(${achievementPoints.points}) FILTER (
        WHERE ${pointCategories.code} = 'PENALTI' AND ${achievementPoints.status} IN ('active', 'challenged')
      ), 0) * ${penaltiPointImpact}
    )`.as('poin_aha_balance')

    const orderExpr = input.type === 'bintang' ? desc(bintangCountExpr) : desc(poinAhaBalanceExpr)

    const teamCondition = input.teamId ? sql`AND ${users.teamId} = ${input.teamId}` : sql``

    const baseWhere = sql`
      ${users.isActive} = true
      AND ${users.branchId} = ${ctx.actor.branchId}
      ${teamCondition}
      AND ${achievementPoints.createdAt} >= ${sinceDate}
    `

    const offset = (input.page - 1) * input.limit

    // Count distinct users who have any points in the period
    const countResult = await db.execute<{ total: string }>(sql`
      SELECT COUNT(DISTINCT ${users.id}) AS total
      FROM ${users}
      INNER JOIN ${achievementPoints} ON ${achievementPoints.userId} = ${users.id}
      INNER JOIN ${pointCategories} ON ${pointCategories.id} = ${achievementPoints.categoryId}
      WHERE ${baseWhere}
    `)

    const total = Number(countResult.rows[0]?.total ?? 0)

    const rows = await db.execute<{
      user_id: string
      name: string
      avatar_url: string | null
      team_id: string | null
      bintang_count: string
      penalti_sum: string
      poin_aha_balance: string
    }>(sql`
      SELECT
        ${users.id} AS user_id,
        ${users.name} AS name,
        ${users.avatarUrl} AS avatar_url,
        ${users.teamId} AS team_id,
        ${bintangCountExpr},
        ${penaltiSumExpr},
        ${poinAhaBalanceExpr}
      FROM ${users}
      INNER JOIN ${achievementPoints} ON ${achievementPoints.userId} = ${users.id}
      INNER JOIN ${pointCategories} ON ${pointCategories.id} = ${achievementPoints.categoryId}
      WHERE ${baseWhere}
      GROUP BY ${users.id}, ${users.name}, ${users.avatarUrl}, ${users.teamId}
      ORDER BY ${orderExpr}
      LIMIT ${input.limit}
      OFFSET ${offset}
    `)

    const entries: LeaderboardEntry[] = rows.rows.map((row, index) => ({
      rank: offset + index + 1,
      userId: row.user_id,
      name: row.name,
      avatarUrl: row.avatar_url,
      teamId: row.team_id,
      score:
        input.type === 'bintang' ? Number(row.bintang_count) : Number(row.poin_aha_balance ?? 0),
      bintangCount: Number(row.bintang_count),
      penaltiCount: Number(row.penalti_sum),
    }))

    return {
      entries,
      meta: { total, page: input.page, limit: input.limit },
    }
  })
}
