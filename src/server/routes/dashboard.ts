import { Hono } from 'hono'
import * as dashboardService from '../services/dashboard'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const dashboardRoute = new Hono<Env>()

  // GET /dashboard/summary — current user's summary stats
  .get('/summary', async (c) => {
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const data = await dashboardService.getSummary({ actor, tx })

    return c.json<ApiResponse<typeof data>>({
      success: true,
      data,
      error: null,
    })
  })

  // GET /dashboard/activity — recent activity in branch
  .get('/activity', async (c) => {
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const data = await dashboardService.getRecentActivity({ actor, tx })

    return c.json<ApiResponse<typeof data>>({
      success: true,
      data,
      error: null,
    })
  })
