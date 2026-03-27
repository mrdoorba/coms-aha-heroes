import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createCommentSchema,
  updateCommentSchema,
  listCommentsSchema,
} from '~/shared/schemas/comments'
import * as commentsService from '../services/comments'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const commentsRoute = new Hono<Env>()

  // GET /comments — list comments for an entity
  .get('/', zValidator('query', listCommentsSchema), async (c) => {
    const input = c.req.valid('query')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const result = await commentsService.listComments(input, { actor, tx })

    return c.json<
      ApiResponse<typeof result.comments> & { meta: PaginationMeta }
    >({
      success: true,
      data: result.comments,
      error: null,
      meta: result.meta,
    })
  })

  // POST /comments — create a comment
  .post('/', zValidator('json', createCommentSchema), async (c) => {
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const created = await commentsService.createComment(input, { actor, tx })
      return c.json<ApiResponse<typeof created>>(
        { success: true, data: created, error: null },
        201,
      )
    } catch (err) {
      if (err instanceof commentsService.EntityNotFoundError) {
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

  // PATCH /comments/:id — update own comment
  .patch('/:id', zValidator('json', updateCommentSchema), async (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const updated = await commentsService.updateComment(id, input, {
        actor,
        tx,
      })
      return c.json<ApiResponse<typeof updated>>({
        success: true,
        data: updated,
        error: null,
      })
    } catch (err) {
      if (err instanceof commentsService.CommentNotFoundError) {
        return c.json<ApiError>(
          {
            success: false,
            data: null,
            error: { code: 'NOT_FOUND', message: err.message },
          },
          404,
        )
      }
      if (err instanceof commentsService.NotCommentAuthorError) {
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
