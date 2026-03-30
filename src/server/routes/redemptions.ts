import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  requestRedemptionSchema,
  listRedemptionsSchema,
  resolveRedemptionSchema,
} from '~/shared/schemas/redemptions'
import { bulkRedemptionActionSchema } from '~/shared/schemas/bulk'
import * as redemptionsService from '../services/redemptions'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const redemptionsRoute = new Hono<Env>()

  // POST / — request a redemption (any authenticated user)
  .post('/', zValidator('json', requestRedemptionSchema), async (c) => {
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress =
      c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const created = await redemptionsService.requestRedemption(input, {
        actor,
        tx,
        ipAddress,
      })
      return c.json<ApiResponse<typeof created>>(
        { success: true, data: created, error: null },
        201,
      )
    } catch (err) {
      if (err instanceof redemptionsService.RewardNotFoundError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'NOT_FOUND', message: err.message },
          },
          404,
        )
      }
      if (err instanceof redemptionsService.RewardNotActiveError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'REWARD_NOT_ACTIVE', message: err.message },
          },
          422,
        )
      }
      if (err instanceof redemptionsService.InsufficientBalanceError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'INSUFFICIENT_BALANCE', message: err.message },
          },
          422,
        )
      }
      throw err
    }
  })

  // POST /bulk — bulk approve/reject redemptions (HR/Admin only)
  .post('/bulk', zValidator('json', bulkRedemptionActionSchema), async (c) => {
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const result = await redemptionsService.bulkResolveRedemptions(input, { actor, tx, ipAddress })
      return c.json<ApiResponse<typeof result>>({ success: true, data: result, error: null })
    } catch (err) {
      if (err instanceof redemptionsService.InsufficientRoleError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } },
          403,
        )
      }
      throw err
    }
  })

  // GET / — list redemptions (with optional mine filter)
  .get('/', zValidator('query', listRedemptionsSchema), async (c) => {
    const input = c.req.valid('query')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const result = await redemptionsService.listRedemptions(input, {
      actor,
      tx,
    })

    return c.json<ApiResponse<typeof result.redemptions> & { meta: PaginationMeta }>({
      success: true,
      data: result.redemptions,
      error: null,
      meta: result.meta,
    })
  })

  // GET /:id — get redemption by id
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const redemption = await redemptionsService.getRedemptionById(id, {
        actor,
        tx,
      })
      return c.json<ApiResponse<typeof redemption>>({
        success: true,
        data: redemption,
        error: null,
      })
    } catch (err) {
      if (err instanceof redemptionsService.RedemptionNotFoundError) {
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

  // PATCH /:id/approve — approve a redemption (HR/Admin only)
  .patch('/:id/approve', async (c) => {
    const id = c.req.param('id')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress =
      c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const updated = await redemptionsService.approveRedemption(id, {
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
      if (err instanceof redemptionsService.RedemptionNotFoundError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'NOT_FOUND', message: err.message },
          },
          404,
        )
      }
      if (err instanceof redemptionsService.RedemptionNotPendingError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'NOT_PENDING', message: err.message },
          },
          409,
        )
      }
      if (err instanceof redemptionsService.InsufficientRoleError) {
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

  // PATCH /:id/reject — reject a redemption (HR/Admin only)
  .patch('/:id/reject', zValidator('json', resolveRedemptionSchema), async (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress =
      c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const updated = await redemptionsService.rejectRedemption(id, input, {
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
      if (err instanceof redemptionsService.RedemptionNotFoundError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'NOT_FOUND', message: err.message },
          },
          404,
        )
      }
      if (err instanceof redemptionsService.RedemptionNotPendingError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'NOT_PENDING', message: err.message },
          },
          409,
        )
      }
      if (err instanceof redemptionsService.InsufficientRoleError) {
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
