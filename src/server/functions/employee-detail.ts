import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/server/auth'
import { db } from '~/db'
import { users, teams, achievementPoints, pointCategories, pointSummaries } from '~/db/schema'
import { eq, and, desc, sql, inArray } from 'drizzle-orm'
import type { PointCategoryCode } from '~/shared/constants/point-categories'

/** Verify caller is admin/hr/leader — reused by both functions */
async function requirePrivilegedCaller() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Not authenticated')

  const [caller] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1)

  if (!caller || !['admin', 'hr', 'leader'].includes(caller.role)) {
    throw new Error('Forbidden')
  }
}

function buildCondition(userId: string, categoryId: string) {
  return and(
    eq(achievementPoints.userId, userId),
    eq(achievementPoints.categoryId, categoryId),
    eq(achievementPoints.status, 'active'),
  )
}

function monthlyCountQuery(condition: ReturnType<typeof buildCondition>) {
  return db
    .select({
      month: sql<string>`to_char(${achievementPoints.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(achievementPoints)
    .where(condition)
    .groupBy(sql`to_char(${achievementPoints.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${achievementPoints.createdAt}, 'YYYY-MM')`)
}

function monthlySumQuery(condition: ReturnType<typeof buildCondition>) {
  return db
    .select({
      month: sql<string>`to_char(${achievementPoints.createdAt}, 'YYYY-MM')`,
      count: sql<number>`coalesce(sum(${achievementPoints.points}), 0)::int`,
    })
    .from(achievementPoints)
    .where(condition)
    .groupBy(sql`to_char(${achievementPoints.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${achievementPoints.createdAt}, 'YYYY-MM')`)
}

/**
 * Full initial load — employee info, summary, all 3 charts, first page of history.
 * Called once from the route loader.
 */
export const getEmployeeDetailFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    await requirePrivilegedCaller()

    const [employee] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        department: users.department,
        position: users.position,
        teamId: users.teamId,
        teamName: teams.name,
        isActive: users.isActive,
      })
      .from(users)
      .leftJoin(teams, eq(users.teamId, teams.id))
      .where(eq(users.id, data.userId))
      .limit(1)

    if (!employee) throw new Error('User not found')

    const categories = await db
      .select({ id: pointCategories.id, code: pointCategories.code })
      .from(pointCategories)
      .where(inArray(pointCategories.code, ['BINTANG', 'PENALTI', 'POIN_AHA']))

    const categoryMap = Object.fromEntries(categories.map((c) => [c.code, c.id])) as Record<
      PointCategoryCode,
      string
    >

    const bintangCondition = buildCondition(data.userId, categoryMap.BINTANG)
    const limit = 50

    const [bintangRows, bintangChart, penaltiChart, poinAhaChart, summaryRow] = await Promise.all([
      db
        .select({
          id: achievementPoints.id,
          points: achievementPoints.points,
          reason: achievementPoints.reason,
          relatedStaff: achievementPoints.relatedStaff,
          screenshotUrl: achievementPoints.screenshotUrl,
          kittaComponent: achievementPoints.kittaComponent,
          createdAt: achievementPoints.createdAt,
          _total: sql<number>`count(*) over()`.as('_total'),
        })
        .from(achievementPoints)
        .where(bintangCondition)
        .orderBy(desc(achievementPoints.createdAt))
        .limit(limit),
      monthlyCountQuery(bintangCondition),
      monthlySumQuery(buildCondition(data.userId, categoryMap.PENALTI)),
      monthlySumQuery(buildCondition(data.userId, categoryMap.POIN_AHA)),
      db
        .select({
          bintangCount: pointSummaries.bintangCount,
          penaltiPointsSum: pointSummaries.penaltiPointsSum,
          directPoinAha: pointSummaries.directPoinAha,
        })
        .from(pointSummaries)
        .where(eq(pointSummaries.userId, data.userId))
        .limit(1),
    ])

    const total = bintangRows[0]?._total ?? 0
    const points = bintangRows.map(({ _total, ...row }) => row)

    return {
      employee,
      categoryMap,
      points,
      meta: { total, page: 1, limit },
      charts: {
        BINTANG: bintangChart,
        PENALTI: penaltiChart,
        POIN_AHA: poinAhaChart,
      },
      summary: summaryRow[0] ?? { bintangCount: 0, penaltiPointsSum: 0, directPoinAha: 0 },
    }
  })

/**
 * Lightweight history fetch — single query with window-function count.
 * Called on tab switch and pagination. Accepts categoryId directly to skip lookup.
 */
export const getEmployeeHistoryFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { userId: string; categoryId: string; page?: number; limit?: number }) => data,
  )
  .handler(async ({ data }) => {
    await requirePrivilegedCaller()

    const page = data.page ?? 1
    const limit = data.limit ?? 50

    const condition = buildCondition(data.userId, data.categoryId)

    const rows = await db
      .select({
        id: achievementPoints.id,
        points: achievementPoints.points,
        reason: achievementPoints.reason,
        relatedStaff: achievementPoints.relatedStaff,
        screenshotUrl: achievementPoints.screenshotUrl,
        kittaComponent: achievementPoints.kittaComponent,
        createdAt: achievementPoints.createdAt,
        _total: sql<number>`count(*) over()`.as('_total'),
      })
      .from(achievementPoints)
      .where(condition)
      .orderBy(desc(achievementPoints.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    const total = rows[0]?._total ?? 0
    const points = rows.map(({ _total, ...row }) => row)

    return {
      points,
      meta: { total, page, limit },
    }
  })
