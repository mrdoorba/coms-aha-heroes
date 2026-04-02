import { eq, and, count, sql, desc } from 'drizzle-orm'
import { pointSummaries, users } from '~/db/schema'
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
}

export async function getLeaderboard(
  input: LeaderboardInput,
  ctx: ServiceContext,
): Promise<{ entries: LeaderboardEntry[]; meta: { total: number; page: number; limit: number } }> {
  const { bintangPointImpact, penaltiPointImpact } = await getPointImpactSettings()

  return withRLS(ctx.actor, async (db) => {
    const whereConditions = input.teamId
      ? and(
          eq(pointSummaries.branchId, ctx.actor.branchId),
          eq(users.isActive, true),
          eq(users.teamId, input.teamId),
        )
      : and(
          eq(pointSummaries.branchId, ctx.actor.branchId),
          eq(users.isActive, true),
        )

    // Compute poinAhaBalance in SQL so we can ORDER BY and LIMIT/OFFSET in the DB
    const poinAhaBalanceExpr = sql<number>`(
      ${pointSummaries.directPoinAha}
      + ${pointSummaries.bintangCount} * ${bintangPointImpact}
      - ${pointSummaries.penaltiPointsSum} * ${penaltiPointImpact}
      - ${pointSummaries.redeemedTotal}
    )`.as('poin_aha_balance')

    const orderExpr = input.type === 'bintang'
      ? desc(pointSummaries.bintangCount)
      : desc(poinAhaBalanceExpr)

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
    }))

    return {
      entries,
      meta: { total, page: input.page, limit: input.limit },
    }
  })
}
