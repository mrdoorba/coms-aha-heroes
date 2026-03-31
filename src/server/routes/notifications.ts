import { Elysia, t } from 'elysia'
import { paginationQuery } from './_query'
import * as notificationsRepo from '../repositories/notifications'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'

type Ctx = { authUser: AuthUser; tx: DbClient }

export const notificationsRoute = new Elysia({ prefix: '/notifications' })

  // GET /notifications — list own notifications
  .get('/', async ({ query, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx
    const { page, limit, unread } = query

    const { rows, total } = await notificationsRepo.listNotifications(
      { userId: actor.id, page, limit, unread },
      tx,
    )

    return {
      success: true,
      data: rows,
      error: null,
      meta: { total, page, limit },
    }
  }, { query: t.Object({
    ...paginationQuery,
    unread: t.Optional(t.BooleanString()),
  }) })

  // GET /notifications/unread-count — unread count for bell badge
  .get('/unread-count', async (c) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    const count = await notificationsRepo.countUnread(actor.id, tx)

    return { success: true, data: { count }, error: null }
  })

  // PATCH /notifications/read-all — mark all unread as read
  .patch('/read-all', async (c) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    const updatedCount = await notificationsRepo.markAllRead(actor.id, tx)

    return { success: true, data: { updatedCount }, error: null }
  })

  // PATCH /notifications/:id/read — mark single notification as read
  .patch('/:id/read', async ({ params, set, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    const updated = await notificationsRepo.markRead(params.id, actor.id, tx)

    if (!updated) {
      set.status = 404
      return { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Notification not found' } }
    }

    return { success: true, data: updated, error: null }
  })
