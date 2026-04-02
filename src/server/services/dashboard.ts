import { eq, and, desc, count } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { pointSummaries, achievementPoints, pointCategories, users } from '~/db/schema'
import { withRLS } from '../repositories/base'
import { getPointImpactSettings } from './settings-cache'
import type { AuthUser } from '../middleware/auth'

type ServiceContext = {
  readonly actor: AuthUser
  readonly ipAddress?: string
}

export type DashboardSummary = {
  bintangCount: number
  poinAhaBalance: number
  penaltiCount: number
  pendingCount: number
}

export type ActivityItem = {
  id: string
  categoryCode: string
  categoryName: string
  points: number
  status: string
  reason: string
  userName: string
  userAvatarUrl: string | null
  submitterName: string
  createdAt: string
}

export async function getSummary(ctx: ServiceContext): Promise<DashboardSummary> {
  const { bintangPointImpact, penaltiPointImpact } = await getPointImpactSettings()

  return withRLS(ctx.actor, async (db) => {

    const summaryRows = await db
      .select({
        bintangCount: pointSummaries.bintangCount,
        penaltiPointsSum: pointSummaries.penaltiPointsSum,
        directPoinAha: pointSummaries.directPoinAha,
        redeemedTotal: pointSummaries.redeemedTotal,
      })
      .from(pointSummaries)
      .where(eq(pointSummaries.userId, ctx.actor.id))
      .limit(1)

    const summary = summaryRows[0]
    const bintangCount = summary?.bintangCount ?? 0
    const penaltiPointsSum = summary?.penaltiPointsSum ?? 0
    const directPoinAha = summary?.directPoinAha ?? 0
    const redeemedTotal = summary?.redeemedTotal ?? 0

    const poinAhaBalance =
      directPoinAha + bintangCount * bintangPointImpact - penaltiPointsSum * penaltiPointImpact - redeemedTotal

    const pendingCount = await getPendingCount(ctx, db)

    return {
      bintangCount,
      poinAhaBalance,
      penaltiCount: penaltiPointsSum,
      pendingCount,
    }
  })
}

async function getPendingCount(
  ctx: ServiceContext,
  db: Parameters<Parameters<typeof withRLS>[1]>[0],
): Promise<number> {
  const role = ctx.actor.role

  if (role === 'employee') return 0

  if (role === 'leader') {
    if (!ctx.actor.teamId) return 0
    const rows = await db
      .select({ cnt: count() })
      .from(achievementPoints)
      .innerJoin(users, eq(achievementPoints.userId, users.id))
      .where(
        and(
          eq(achievementPoints.status, 'pending'),
          eq(users.teamId, ctx.actor.teamId),
        ),
      )
    return Number(rows[0]?.cnt ?? 0)
  }

  // hr / admin — all pending in branch
  const rows = await db
    .select({ cnt: count() })
    .from(achievementPoints)
    .where(
      and(
        eq(achievementPoints.status, 'pending'),
        eq(achievementPoints.branchId, ctx.actor.branchId),
      ),
    )
  return Number(rows[0]?.cnt ?? 0)
}

export async function getRecentActivity(ctx: ServiceContext): Promise<ActivityItem[]> {
  const submitter = alias(users, 'submitter')

  return withRLS(ctx.actor, async (db) => {
    const rows = await db
      .select({
        id: achievementPoints.id,
        categoryCode: pointCategories.code,
        categoryName: pointCategories.defaultName,
        points: achievementPoints.points,
        status: achievementPoints.status,
        reason: achievementPoints.reason,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        submitterName: submitter.name,
        createdAt: achievementPoints.createdAt,
      })
      .from(achievementPoints)
      .innerJoin(users, eq(achievementPoints.userId, users.id))
      .innerJoin(submitter, eq(achievementPoints.submittedBy, submitter.id))
      .innerJoin(pointCategories, eq(achievementPoints.categoryId, pointCategories.id))
      .where(eq(achievementPoints.branchId, ctx.actor.branchId))
      .orderBy(desc(achievementPoints.createdAt))
      .limit(10)

    return rows.map((row) => ({
      id: row.id,
      categoryCode: row.categoryCode,
      categoryName: row.categoryName,
      points: row.points,
      status: row.status,
      reason: row.reason,
      userName: row.userName,
      userAvatarUrl: row.userAvatarUrl,
      submitterName: row.submitterName ?? 'Unknown',
      createdAt: row.createdAt.toISOString(),
    }))
  })
}
