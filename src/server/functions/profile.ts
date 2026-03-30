import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/server/auth'
import { db } from '~/db'
import { users } from '~/db/schema/users'
import { pointSummaries } from '~/db/schema/point-summaries'
import { teams } from '~/db/schema/teams'
import { branches } from '~/db/schema/branches'
import { eq } from 'drizzle-orm'

export const getProfileFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) throw new Error('Not authenticated')

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        department: users.department,
        position: users.position,
        avatarUrl: users.avatarUrl,
        localePref: users.localePref,
        branchId: users.branchId,
        teamId: users.teamId,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (!user) throw new Error('User not found')

    // Fetch stats
    const [stats] = await db
      .select({
        bintangCount: pointSummaries.bintangCount,
        penaltiPointsSum: pointSummaries.penaltiPointsSum,
        directPoinAha: pointSummaries.directPoinAha,
        redeemedTotal: pointSummaries.redeemedTotal,
      })
      .from(pointSummaries)
      .where(eq(pointSummaries.userId, user.id))
      .limit(1)

    // Fetch team name
    let teamName: string | null = null
    if (user.teamId) {
      const [team] = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.id, user.teamId))
        .limit(1)
      teamName = team?.name ?? null
    }

    // Fetch branch name
    const [branch] = await db
      .select({ name: branches.name })
      .from(branches)
      .where(eq(branches.id, user.branchId))
      .limit(1)

    return {
      user: {
        ...user,
        teamName,
        branchName: branch?.name ?? null,
      },
      stats: stats ?? {
        bintangCount: 0,
        penaltiPointsSum: 0,
        directPoinAha: 0,
        redeemedTotal: 0,
      },
    }
  },
)
