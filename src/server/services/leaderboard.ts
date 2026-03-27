import { eq, and } from 'drizzle-orm'
import { pointSummaries, systemSettings, users } from '~/db/schema'
import { getDb } from '../repositories/base'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
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
  const db = getDb(ctx.tx)

  const [bintangSetting, penaltiSetting] = await Promise.all([
    db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, 'bintang_point_impact'))
      .limit(1),
    db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, 'penalti_point_impact'))
      .limit(1),
  ])

  const bintangPointImpact = (bintangSetting[0]?.value as number) ?? 10
  const penaltiPointImpact = (penaltiSetting[0]?.value as number) ?? 5

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

  const rows = await db
    .select({
      userId: pointSummaries.userId,
      name: users.name,
      avatarUrl: users.avatarUrl,
      teamId: users.teamId,
      bintangCount: pointSummaries.bintangCount,
      penaltiPointsSum: pointSummaries.penaltiPointsSum,
      directPoinAha: pointSummaries.directPoinAha,
      redeemedTotal: pointSummaries.redeemedTotal,
    })
    .from(pointSummaries)
    .innerJoin(users, eq(pointSummaries.userId, users.id))
    .where(whereConditions)

  const computed = rows.map((row) => {
    const poinAhaBalance =
      row.directPoinAha +
      row.bintangCount * bintangPointImpact -
      row.penaltiPointsSum * penaltiPointImpact -
      row.redeemedTotal

    return {
      userId: row.userId,
      name: row.name,
      avatarUrl: row.avatarUrl,
      teamId: row.teamId,
      bintangCount: row.bintangCount,
      poinAhaBalance,
    }
  })

  const sorted =
    input.type === 'bintang'
      ? [...computed].sort((a, b) => b.bintangCount - a.bintangCount)
      : [...computed].sort((a, b) => b.poinAhaBalance - a.poinAhaBalance)

  const total = sorted.length
  const offset = (input.page - 1) * input.limit
  const paginated = sorted.slice(offset, offset + input.limit)

  const entries: LeaderboardEntry[] = paginated.map((item, index) => ({
    rank: offset + index + 1,
    userId: item.userId,
    name: item.name,
    avatarUrl: item.avatarUrl,
    teamId: item.teamId,
    score: input.type === 'bintang' ? item.bintangCount : item.poinAhaBalance,
    bintangCount: item.bintangCount,
  }))

  return {
    entries,
    meta: { total, page: input.page, limit: input.limit },
  }
}
