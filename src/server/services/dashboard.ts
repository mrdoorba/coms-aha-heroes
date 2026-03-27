import { eq, and, desc, count } from 'drizzle-orm'
import { pointSummaries, systemSettings, achievementPoints, pointCategories, users } from '~/db/schema'
import { getDb } from '../repositories/base'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
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
  const db = getDb(ctx.tx)

  const [bintangSetting, penaltiSetting] = await Promise.all([
    db.select({ value: systemSettings.value }).from(systemSettings).where(eq(systemSettings.key, 'bintang_point_impact')).limit(1),
    db.select({ value: systemSettings.value }).from(systemSettings).where(eq(systemSettings.key, 'penalti_point_impact')).limit(1),
  ])

  const bintangImpact = (bintangSetting[0]?.value as number) ?? 10
  const penaltiImpact = (penaltiSetting[0]?.value as number) ?? 5

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
    directPoinAha + bintangCount * bintangImpact - penaltiPointsSum * penaltiImpact - redeemedTotal

  const pendingCount = await getPendingCount(ctx, db)

  return {
    bintangCount,
    poinAhaBalance,
    penaltiCount: penaltiPointsSum,
    pendingCount,
  }
}

async function getPendingCount(
  ctx: ServiceContext,
  db: ReturnType<typeof getDb>,
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
  const db = getDb(ctx.tx)

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
      submittedBy: achievementPoints.submittedBy,
      createdAt: achievementPoints.createdAt,
    })
    .from(achievementPoints)
    .innerJoin(users, eq(achievementPoints.userId, users.id))
    .innerJoin(pointCategories, eq(achievementPoints.categoryId, pointCategories.id))
    .where(eq(achievementPoints.branchId, ctx.actor.branchId))
    .orderBy(desc(achievementPoints.createdAt))
    .limit(10)

  if (rows.length === 0) return []

  const submitterIds = [...new Set(rows.map((r) => r.submittedBy))]
  const submitterMap = new Map<string, string>()
  await Promise.all(
    submitterIds.map(async (sid) => {
      const [sub] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, sid))
        .limit(1)
      if (sub) submitterMap.set(sid, sub.name)
    }),
  )

  return rows.map((row) => ({
    id: row.id,
    categoryCode: row.categoryCode,
    categoryName: row.categoryName,
    points: row.points,
    status: row.status,
    reason: row.reason,
    userName: row.userName,
    userAvatarUrl: row.userAvatarUrl,
    submitterName: submitterMap.get(row.submittedBy) ?? 'Unknown',
    createdAt: row.createdAt.toISOString(),
  }))
}
