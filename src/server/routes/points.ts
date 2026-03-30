import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { submitPointSchema, listPointsSchema, approveRejectSchema } from '~/shared/schemas/points'
import { bulkPointActionSchema } from '~/shared/schemas/bulk'
import * as pointsService from '../services/points'
import * as approvalService from '../services/approval'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const pointsRoute = new Hono<Env>()

  // POST /points — submit a new point
  .post('/', zValidator('json', submitPointSchema), async (c) => {
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const created = await pointsService.submitPoint(input, {
        actor,
        tx,
        ipAddress,
      })
      return c.json<ApiResponse<typeof created>>(
        { success: true, data: created, error: null },
        201,
      )
    } catch (err) {
      if (err instanceof pointsService.CategoryNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } },
          404,
        )
      }
      if (err instanceof pointsService.CategoryDisabledError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'CATEGORY_DISABLED', message: err.message } },
          422,
        )
      }
      if (err instanceof pointsService.TargetUserNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'USER_NOT_FOUND', message: err.message } },
          404,
        )
      }
      if (err instanceof pointsService.ScreenshotRequiredError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'SCREENSHOT_REQUIRED', message: err.message } },
          422,
        )
      }
      if (
        err instanceof pointsService.SelfPenaltiError ||
        err instanceof pointsService.LeaderSelfGiveError ||
        err instanceof pointsService.InsufficientRoleForPenaltiError
      ) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } },
          403,
        )
      }
      throw err
    }
  })

  // POST /bulk — bulk approve/reject points (HR/Admin/Leader)
  .post('/bulk', zValidator('json', bulkPointActionSchema), async (c) => {
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    const result = await approvalService.bulkResolvePoints(input, { actor, tx, ipAddress })
    return c.json<ApiResponse<typeof result>>({ success: true, data: result, error: null })
  })

  // GET /points — paginated list with filters
  .get('/', zValidator('query', listPointsSchema), async (c) => {
    const input = c.req.valid('query')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const result = await pointsService.listPoints(input, { actor, tx })

    return c.json<ApiResponse<typeof result.points> & { meta: PaginationMeta }>({
      success: true,
      data: result.points,
      error: null,
      meta: result.meta,
    })
  })

  // GET /points/:id — detail with submitter info
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const point = await pointsService.getPointById(id, { actor, tx })
      return c.json<ApiResponse<typeof point>>({
        success: true,
        data: point,
        error: null,
      })
    } catch (err) {
      if (err instanceof pointsService.PointNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } },
          404,
        )
      }
      throw err
    }
  })

  // PATCH /points/:id/approve — approve a pending point
  .patch('/:id/approve', zValidator('json', approveRejectSchema), async (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const updated = await approvalService.approvePoint(id, input, { actor, tx, ipAddress })
      return c.json<ApiResponse<typeof updated>>({ success: true, data: updated, error: null })
    } catch (err) {
      if (err instanceof approvalService.PointNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } },
          404,
        )
      }
      if (err instanceof approvalService.PointNotPendingError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_PENDING', message: err.message } },
          409,
        )
      }
      if (err instanceof approvalService.UnauthorizedApprovalError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } },
          403,
        )
      }
      throw err
    }
  })

  // PATCH /points/:id/reject — reject a pending point
  .patch('/:id/reject', zValidator('json', approveRejectSchema), async (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const updated = await approvalService.rejectPoint(id, input, { actor, tx, ipAddress })
      return c.json<ApiResponse<typeof updated>>({ success: true, data: updated, error: null })
    } catch (err) {
      if (err instanceof approvalService.PointNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } },
          404,
        )
      }
      if (err instanceof approvalService.PointNotPendingError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_PENDING', message: err.message } },
          409,
        )
      }
      if (err instanceof approvalService.UnauthorizedApprovalError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } },
          403,
        )
      }
      throw err
    }
  })

  // PATCH /points/:id/revoke — revoke an active point (HR/Admin only)
  .patch('/:id/revoke', zValidator('json', approveRejectSchema), async (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const updated = await approvalService.revokePoint(id, input, { actor, tx, ipAddress })
      return c.json<ApiResponse<typeof updated>>({ success: true, data: updated, error: null })
    } catch (err) {
      if (err instanceof approvalService.PointNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } },
          404,
        )
      }
      if (err instanceof approvalService.PointNotActiveError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_ACTIVE', message: err.message } },
          409,
        )
      }
      if (err instanceof approvalService.UnauthorizedApprovalError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } },
          403,
        )
      }
      throw err
    }
  })
