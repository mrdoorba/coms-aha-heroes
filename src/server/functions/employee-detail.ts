import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/server/auth'
import { db } from '~/db'
import {
  users,
  teams,
  achievementPoints,
  pointCategories,
  pointSummaries,
} from '~/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

type EmployeeDetailParams = {
  userId: string
  page?: number
  limit?: number
}

export const getEmployeeDetailFn = createServerFn({ method: 'GET' })
  .inputValidator((data: EmployeeDetailParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Not authenticated')

    // Check caller role — only admin, hr, leader can view
    const [caller] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (!caller || !['admin', 'hr', 'leader'].includes(caller.role)) {
      throw new Error('Forbidden')
    }

    const page = data.page ?? 1
    const limit = data.limit ?? 50

    // Fetch user info + team name
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

    // Fetch BINTANG category id
    const [bintangCat] = await db
      .select({ id: pointCategories.id })
      .from(pointCategories)
      .where(eq(pointCategories.code, 'BINTANG'))
      .limit(1)

    const bintangCategoryId = bintangCat?.id

    // Fetch points history (BINTANG, active only) + total count
    const bintangCondition = bintangCategoryId
      ? and(
          eq(achievementPoints.userId, data.userId),
          eq(achievementPoints.categoryId, bintangCategoryId),
          eq(achievementPoints.status, 'active'),
        )
      : and(
          eq(achievementPoints.userId, data.userId),
          eq(achievementPoints.status, 'active'),
        )

    const [pointRows, [{ total }]] = await Promise.all([
      db
        .select({
          id: achievementPoints.id,
          points: achievementPoints.points,
          reason: achievementPoints.reason,
          relatedStaff: achievementPoints.relatedStaff,
          screenshotUrl: achievementPoints.screenshotUrl,
          createdAt: achievementPoints.createdAt,
        })
        .from(achievementPoints)
        .where(bintangCondition)
        .orderBy(desc(achievementPoints.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(achievementPoints)
        .where(bintangCondition),
    ])

    // Monthly aggregation for chart (last 12 months)
    const monthlyData = await db
      .select({
        month: sql<string>`to_char(${achievementPoints.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(achievementPoints)
      .where(bintangCondition)
      .groupBy(sql`to_char(${achievementPoints.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${achievementPoints.createdAt}, 'YYYY-MM')`)

    // Point summary
    const [summary] = await db
      .select({
        bintangCount: pointSummaries.bintangCount,
        penaltiPointsSum: pointSummaries.penaltiPointsSum,
        directPoinAha: pointSummaries.directPoinAha,
      })
      .from(pointSummaries)
      .where(eq(pointSummaries.userId, data.userId))
      .limit(1)

    return {
      employee,
      points: pointRows,
      meta: { total, page, limit },
      monthlyChart: monthlyData,
      summary: summary ?? { bintangCount: 0, penaltiPointsSum: 0, directPoinAha: 0 },
    }
  })
