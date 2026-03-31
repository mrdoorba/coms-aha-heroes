import { Elysia, t } from 'elysia'
import {
  createRewardSchema,
  updateRewardSchema,
} from '~/shared/schemas/rewards'
import { paginationQuery } from './_query'
import * as rewardsService from '../services/rewards'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'

type Ctx = { authUser: AuthUser; tx: DbClient }

export const rewardsRoute = new Elysia({ prefix: '/rewards' })

  // GET /rewards — list rewards (any authenticated user)
  .get('/', async ({ query, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    const result = await rewardsService.listRewards(query, { actor, tx })

    return {
      success: true,
      data: result.rewards,
      error: null,
      meta: result.meta,
    }
  }, { query: t.Object({ ...paginationQuery }) })

  // GET /rewards/:id — get reward by id
  .get('/:id', async ({ params, set, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    try {
      const reward = await rewardsService.getRewardById(params.id, { actor, tx })
      return { success: true, data: reward, error: null }
    } catch (err) {
      if (err instanceof rewardsService.RewardNotFoundError) {
        set.status = 404
        return { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } }
      }
      throw err
    }
  })

  // POST /rewards — create reward (HR/Admin)
  .post('/', async ({ body, headers, set, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx
    const ipAddress = headers['x-forwarded-for'] ?? headers['x-real-ip']

    try {
      const created = await rewardsService.createReward(body, {
        actor,
        tx,
        ipAddress,
      })
      set.status = 201
      return { success: true, data: created, error: null }
    } catch (err) {
      if (err instanceof rewardsService.InsufficientRoleError) {
        set.status = 403
        return { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } }
      }
      throw err
    }
  }, { body: createRewardSchema })

  // PATCH /rewards/:id — update reward (HR/Admin)
  .patch('/:id', async ({ params, body, headers, set, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx
    const ipAddress = headers['x-forwarded-for'] ?? headers['x-real-ip']

    try {
      const updated = await rewardsService.updateReward(params.id, body, {
        actor,
        tx,
        ipAddress,
      })
      return { success: true, data: updated, error: null }
    } catch (err) {
      if (err instanceof rewardsService.RewardNotFoundError) {
        set.status = 404
        return { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } }
      }
      if (err instanceof rewardsService.InsufficientRoleError) {
        set.status = 403
        return { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } }
      }
      throw err
    }
  }, { body: updateRewardSchema })
