import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  fileAppealSchema,
  resolveAppealSchema,
  listAppealsSchema,
} from '~/shared/schemas/appeals'
import * as appealsService from '../services/appeals'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const appealsRoute = new Hono<Env>()

  // GET /points/:pointId/appeals — list appeals for a point
  .get(
    '/points/:pointId/appeals',
    zValidator('query', listAppealsSchema),
    async (c) => {
      const pointId = c.req.param('pointId')
      const input = c.req.valid('query')
      const actor = c.get('authUser')
      const tx = c.get('tx')

      const result = await appealsService.listAppeals(pointId, input, {
        actor,
        tx,
      })

      return c.json<
        ApiResponse<typeof result.appeals> & { meta: PaginationMeta }
      >({
        success: true,
        data: result.appeals,
        error: null,
        meta: result.meta,
      })
    },
  )

  // POST /points/:pointId/appeals — file an appeal
  .post(
    '/points/:pointId/appeals',
    zValidator('json', fileAppealSchema),
    async (c) => {
      const pointId = c.req.param('pointId')
      const input = c.req.valid('json')
      const actor = c.get('authUser')
      const tx = c.get('tx')
      const ipAddress =
        c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

      try {
        const created = await appealsService.fileAppeal(pointId, input, {
          actor,
          tx,
          ipAddress,
        })
        return c.json<ApiResponse<typeof created>>(
          { success: true, data: created, error: null },
          201,
        )
      } catch (err) {
        if (err instanceof appealsService.AchievementNotFoundError) {
          return c.json<ApiError>(
            {
              success: false,
              data: null,
              error: { code: 'NOT_FOUND', message: err.message },
            },
            404,
          )
        }
        if (err instanceof appealsService.NotPenaltiError) {
          return c.json<ApiError>(
            {
              success: false,
              data: null,
              error: { code: 'NOT_PENALTI', message: err.message },
            },
            422,
          )
        }
        if (
          err instanceof appealsService.NotPenalizedUserError ||
          err instanceof appealsService.InsufficientRoleError
        ) {
          return c.json<ApiError>(
            {
              success: false,
              data: null,
              error: { code: 'FORBIDDEN', message: err.message },
            },
            403,
          )
        }
        if (err instanceof appealsService.DuplicateOpenAppealError) {
          return c.json<ApiError>(
            {
              success: false,
              data: null,
              error: { code: 'DUPLICATE_APPEAL', message: err.message },
            },
            409,
          )
        }
        throw err
      }
    },
  )

  // PATCH /appeals/:id/resolve — resolve an appeal (HR/admin only)
  .patch(
    '/appeals/:id/resolve',
    zValidator('json', resolveAppealSchema),
    async (c) => {
      const id = c.req.param('id')
      const input = c.req.valid('json')
      const actor = c.get('authUser')
      const tx = c.get('tx')
      const ipAddress =
        c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

      try {
        const updated = await appealsService.resolveAppeal(id, input, {
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
        if (err instanceof appealsService.AppealNotFoundError) {
          return c.json<ApiError>(
            {
              success: false,
              data: null,
              error: { code: 'NOT_FOUND', message: err.message },
            },
            404,
          )
        }
        if (err instanceof appealsService.AppealNotOpenError) {
          return c.json<ApiError>(
            {
              success: false,
              data: null,
              error: { code: 'NOT_OPEN', message: err.message },
            },
            409,
          )
        }
        if (err instanceof appealsService.InsufficientRoleError) {
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
    },
  )
