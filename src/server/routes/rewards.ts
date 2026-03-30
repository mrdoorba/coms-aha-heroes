import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  listRewardsSchema,
  createRewardSchema,
  updateRewardSchema,
} from '~/shared/schemas/rewards'
import * as rewardsService from '../services/rewards'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const rewardsRoute = new Hono<Env>()

  // GET /rewards — list rewards (any authenticated user)
  .get('/', zValidator('query', listRewardsSchema), async (c) => {
    const input = c.req.valid('query')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const result = await rewardsService.listRewards(input, { actor, tx })

    return c.json<ApiResponse<typeof result.rewards> & { meta: PaginationMeta }>({
      success: true,
      data: result.rewards,
      error: null,
      meta: result.meta,
    })
  })

  // GET /rewards/:id — get reward by id
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const reward = await rewardsService.getRewardById(id, { actor, tx })
      return c.json<ApiResponse<typeof reward>>({
        success: true,
        data: reward,
        error: null,
      })
    } catch (err) {
      if (err instanceof rewardsService.RewardNotFoundError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'NOT_FOUND', message: err.message },
          },
          404,
        )
      }
      throw err
    }
  })

  // POST /rewards — create reward (HR/Admin)
  .post('/', zValidator('json', createRewardSchema), async (c) => {
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress =
      c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const created = await rewardsService.createReward(input, {
        actor,
        tx,
        ipAddress,
      })
      return c.json<ApiResponse<typeof created>>(
        { success: true, data: created, error: null },
        201,
      )
    } catch (err) {
      if (err instanceof rewardsService.InsufficientRoleError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'FORBIDDEN', message: err.message },
          },
          403,
        )
      }
      throw err
    }
  })

  // PATCH /rewards/:id — update reward (HR/Admin)
  .patch('/:id', zValidator('json', updateRewardSchema), async (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress =
      c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const updated = await rewardsService.updateReward(id, input, {
        actor,
        tx,
        ipAddress,
      })
      return c.json<ApiResponse<typeof updated>>({
        success: true,
        data: updated,
        error: null,
      })
    } catch (err) {
      if (err instanceof rewardsService.RewardNotFoundError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'NOT_FOUND', message: err.message },
          },
          404,
        )
      }
      if (err instanceof rewardsService.InsufficientRoleError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'FORBIDDEN', message: err.message },
          },
          403,
        )
      }
      throw err
    }
  })
