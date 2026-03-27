import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  fileChallengeSchema,
  resolveChallengeSchema,
  listChallengesSchema,
} from '~/shared/schemas/challenges'
import * as challengesService from '../services/challenges'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const challengesRoute = new Hono<Env>()

  // GET /points/:pointId/challenges — list challenges for a point
  .get(
    '/points/:pointId/challenges',
    zValidator('query', listChallengesSchema),
    async (c) => {
      const pointId = c.req.param('pointId')
      const input = c.req.valid('query')
      const actor = c.get('authUser')
      const tx = c.get('tx')

      const result = await challengesService.listChallenges(pointId, input, {
        actor,
        tx,
      })

      return c.json<
        ApiResponse<typeof result.challenges> & { meta: PaginationMeta }
      >({
        success: true,
        data: result.challenges,
        error: null,
        meta: result.meta,
      })
    },
  )

  // POST /points/:pointId/challenges — file a challenge
  .post(
    '/points/:pointId/challenges',
    zValidator('json', fileChallengeSchema),
    async (c) => {
      const pointId = c.req.param('pointId')
      const input = c.req.valid('json')
      const actor = c.get('authUser')
      const tx = c.get('tx')
      const ipAddress =
        c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

      try {
        const created = await challengesService.fileChallenge(pointId, input, {
          actor,
          tx,
          ipAddress,
        })
        return c.json<ApiResponse<typeof created>>(
          { success: true, data: created, error: null },
          201,
        )
      } catch (err) {
        if (err instanceof challengesService.AchievementNotFoundError) {
          return c.json<ApiError>(
            {
              success: false,
              data: null,
              error: { code: 'NOT_FOUND', message: err.message },
            },
            404,
          )
        }
        if (err instanceof challengesService.NotPenaltiError) {
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
          err instanceof challengesService.InsufficientRoleError ||
          err instanceof challengesService.CannotChallengeSelfError
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
        throw err
      }
    },
  )

  // PATCH /challenges/:id/resolve — resolve a challenge (HR/admin only)
  .patch(
    '/challenges/:id/resolve',
    zValidator('json', resolveChallengeSchema),
    async (c) => {
      const id = c.req.param('id')
      const input = c.req.valid('json')
      const actor = c.get('authUser')
      const tx = c.get('tx')
      const ipAddress =
        c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

      try {
        const updated = await challengesService.resolveChallenge(id, input, {
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
        if (err instanceof challengesService.ChallengeNotFoundError) {
          return c.json<ApiError>(
            {
              success: false,
              data: null,
              error: { code: 'NOT_FOUND', message: err.message },
            },
            404,
          )
        }
        if (err instanceof challengesService.ChallengeNotOpenError) {
          return c.json<ApiError>(
            {
              success: false,
              data: null,
              error: { code: 'NOT_OPEN', message: err.message },
            },
            409,
          )
        }
        if (err instanceof challengesService.InsufficientRoleError) {
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
