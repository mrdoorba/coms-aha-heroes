import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { reportsQuerySchema } from '~/shared/schemas/reports'
import * as reportsService from '../services/reports'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const reportsRoute = new Hono<Env>()

  // GET / — get dashboard stats (HR/Admin)
  .get('/', zValidator('query', reportsQuerySchema), async (c) => {
    const input = c.req.valid('query')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const data = await reportsService.getDashboardStats(input, { actor, tx })
      return c.json<ApiResponse<typeof data>>({
        success: true,
        data,
        error: null,
      })
    } catch (err) {
      if (err instanceof reportsService.InsufficientRoleError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } },
          403,
        )
      }
      throw err
    }
  })
