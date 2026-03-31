import { Elysia } from 'elysia'
import * as dashboardService from '../services/dashboard'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'

type Ctx = { authUser: AuthUser; tx: DbClient }

export const dashboardRoute = new Elysia({ prefix: '/dashboard' })

  // GET /dashboard/summary — current user's summary stats
  .get('/summary', async (c) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    const data = await dashboardService.getSummary({ actor, tx })

    return { success: true, data, error: null }
  })

  // GET /dashboard/activity — recent activity in branch
  .get('/activity', async (c) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    const data = await dashboardService.getRecentActivity({ actor, tx })

    return { success: true, data, error: null }
  })
