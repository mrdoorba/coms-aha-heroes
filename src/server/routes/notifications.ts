import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import * as notificationsRepo from '../repositories/notifications'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true
      if (v === 'false') return false
      return undefined
    }),
})

export const notificationsRoute = new Hono<Env>()

  // GET /notifications — list own notifications
  .get('/', zValidator('query', listQuerySchema), async (c) => {
    const { page, limit, unread } = c.req.valid('query')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const { rows, total } = await notificationsRepo.listNotifications(
      { userId: actor.id, page, limit, unread },
      tx,
    )

    return c.json<ApiResponse<typeof rows> & { meta: PaginationMeta }>({
      success: true,
      data: rows,
      error: null,
      meta: { total, page, limit },
    })
  })

  // GET /notifications/unread-count — unread count for bell badge
  .get('/unread-count', async (c) => {
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const count = await notificationsRepo.countUnread(actor.id, tx)

    return c.json<ApiResponse<{ count: number }>>({
      success: true,
      data: { count },
      error: null,
    })
  })

  // PATCH /notifications/read-all — mark all unread as read
  .patch('/read-all', async (c) => {
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const updatedCount = await notificationsRepo.markAllRead(actor.id, tx)

    return c.json<ApiResponse<{ updatedCount: number }>>({
      success: true,
      data: { updatedCount },
      error: null,
    })
  })

  // PATCH /notifications/:id/read — mark single notification as read
  .patch('/:id/read', async (c) => {
    const id = c.req.param('id')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const updated = await notificationsRepo.markRead(id, actor.id, tx)

    if (!updated) {
      return c.json<ApiError>(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Notification not found' } },
        404,
      )
    }

    return c.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
      error: null,
    })
  })
