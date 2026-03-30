import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { rbacMiddleware } from '../middleware/rbac'
import {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
} from '~/shared/schemas/users'
import { bulkUserActionSchema } from '~/shared/schemas/bulk'
import * as usersService from '../services/users'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const usersRoute = new Hono<Env>()
  // All user routes require admin or hr
  .use('/*', rbacMiddleware(['admin', 'hr']))

  // POST /bulk — bulk archive/activate users (Admin/HR only)
  .post('/bulk', zValidator('json', bulkUserActionSchema), async (c) => {
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    const result = await usersService.bulkToggleUsers(input, { actor, tx, ipAddress })
    return c.json<ApiResponse<typeof result>>({ success: true, data: result, error: null })
  })

  // GET /users — list with filtering + pagination
  .get('/', zValidator('query', listUsersSchema), async (c) => {
    const input = c.req.valid('query')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const result = await usersService.listUsers(input, {
      actor,
      tx,
    })

    return c.json<ApiResponse<typeof result.users> & { meta: PaginationMeta }>({
      success: true,
      data: result.users,
      error: null,
      meta: result.meta,
    })
  })

  // GET /users/:id — single user
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const user = await usersService.getUserById(id, { actor, tx })
      return c.json<ApiResponse<typeof user>>({
        success: true,
        data: user,
        error: null,
      })
    } catch (err) {
      if (err instanceof usersService.UserNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } },
          404,
        )
      }
      throw err
    }
  })

  // POST /users — create new user
  .post('/', zValidator('json', createUserSchema), async (c) => {
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const created = await usersService.createUser(input, {
        actor,
        tx,
        ipAddress,
      })
      return c.json<ApiResponse<typeof created>>(
        { success: true, data: created, error: null },
        201,
      )
    } catch (err) {
      if (err instanceof usersService.EmailAlreadyExistsError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'CONFLICT', message: err.message } },
          409,
        )
      }
      throw err
    }
  })

  // PATCH /users/:id — update user
  .patch('/:id', zValidator('json', updateUserSchema), async (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const updated = await usersService.updateUser(id, input, {
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
      if (err instanceof usersService.UserNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } },
          404,
        )
      }
      throw err
    }
  })

  // PATCH /users/:id/archive — soft-delete
  .patch('/:id/archive', async (c) => {
    const id = c.req.param('id')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const archived = await usersService.archiveUser(id, {
        actor,
        tx,
        ipAddress,
      })
      return c.json<ApiResponse<typeof archived>>({
        success: true,
        data: archived,
        error: null,
      })
    } catch (err) {
      if (err instanceof usersService.UserNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } },
          404,
        )
      }
      if (err instanceof usersService.CannotArchiveSelfError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } },
          403,
        )
      }
      if (err instanceof usersService.UserAlreadyArchivedError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'CONFLICT', message: err.message } },
          409,
        )
      }
      throw err
    }
  })
