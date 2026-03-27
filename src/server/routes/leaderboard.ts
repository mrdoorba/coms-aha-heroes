import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import * as leaderboardService from '../services/leaderboard'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

const leaderboardQuerySchema = z.object({
  type: z.enum(['bintang', 'poin_aha']).default('bintang'),
  teamId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const leaderboardRoute = new Hono<Env>()

  // GET /leaderboard — ranked list by bintang or poin_aha
  .get('/', zValidator('query', leaderboardQuerySchema), async (c) => {
    const input = c.req.valid('query')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const result = await leaderboardService.getLeaderboard(input, { actor, tx })

    return c.json<ApiResponse<typeof result.entries> & { meta: PaginationMeta }>({
      success: true,
      data: result.entries,
      error: null,
      meta: result.meta,
    })
  })
