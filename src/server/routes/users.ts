import { Elysia, t } from 'elysia'
import { requireRole } from '../middleware/rbac'
import {
  createUserSchema,
  updateUserSchema,
} from '~/shared/schemas/users'
import { USER_ROLES } from '~/shared/constants'
import { paginationQuery } from './_query'
import { bulkUserActionSchema } from '~/shared/schemas/bulk'
import * as usersService from '../services/users'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'

type Ctx = { authUser: AuthUser; tx: DbClient }

export const usersRoute = new Elysia({ prefix: '/users' })
  // All user routes require admin or hr
  .onBeforeHandle((ctx) => {
    requireRole('admin', 'hr')(ctx as any)
  })

  // POST /users/bulk — bulk archive/activate users (Admin/HR only)
  .post('/bulk', async ({ body, headers, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx
    const ipAddress = headers['x-forwarded-for'] ?? headers['x-real-ip']

    const result = await usersService.bulkToggleUsers(body, { actor, tx, ipAddress })
    return { success: true, data: result, error: null }
  }, { body: bulkUserActionSchema })

  // GET /users — list with filtering + pagination
  .get('/', async ({ query, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    const result = await usersService.listUsers(query, { actor, tx })

    return {
      success: true,
      data: result.users,
      error: null,
      meta: result.meta,
    }
  }, { query: t.Object({
    ...paginationQuery,
    role: t.Optional(t.Union(USER_ROLES.map((r) => t.Literal(r)))),
    teamId: t.Optional(t.String({ format: 'uuid' })),
    search: t.Optional(t.String({ maxLength: 100 })),
    isActive: t.Optional(t.BooleanString()),
    department: t.Optional(t.String({ maxLength: 100 })),
    position: t.Optional(t.String({ maxLength: 100 })),
    branchId: t.Optional(t.String({ format: 'uuid' })),
  }) })

  // GET /users/:id — single user
  .get('/:id', async ({ params, set, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    try {
      const user = await usersService.getUserById(params.id, { actor, tx })
      return { success: true, data: user, error: null }
    } catch (err) {
      if (err instanceof usersService.UserNotFoundError) {
        set.status = 404
        return { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } }
      }
      throw err
    }
  })

  // POST /users — create new user
  .post('/', async ({ body, headers, set, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx
    const ipAddress = headers['x-forwarded-for'] ?? headers['x-real-ip']

    try {
      const created = await usersService.createUser(body, { actor, tx, ipAddress })
      set.status = 201
      return { success: true, data: created, error: null }
    } catch (err) {
      if (err instanceof usersService.EmailAlreadyExistsError) {
        set.status = 409
        return { success: false, data: null, error: { code: 'CONFLICT', message: err.message } }
      }
      throw err
    }
  }, { body: createUserSchema })

  // PATCH /users/:id — update user
  .patch('/:id', async ({ params, body, headers, set, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx
    const ipAddress = headers['x-forwarded-for'] ?? headers['x-real-ip']

    try {
      const updated = await usersService.updateUser(params.id, body, { actor, tx, ipAddress })
      return { success: true, data: updated, error: null }
    } catch (err) {
      if (err instanceof usersService.UserNotFoundError) {
        set.status = 404
        return { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } }
      }
      throw err
    }
  }, { body: updateUserSchema })

  // PATCH /users/:id/archive — soft-delete
  .patch('/:id/archive', async ({ params, headers, set, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx
    const ipAddress = headers['x-forwarded-for'] ?? headers['x-real-ip']

    try {
      const archived = await usersService.archiveUser(params.id, { actor, tx, ipAddress })
      return { success: true, data: archived, error: null }
    } catch (err) {
      if (err instanceof usersService.UserNotFoundError) {
        set.status = 404
        return { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } }
      }
      if (err instanceof usersService.CannotArchiveSelfError) {
        set.status = 403
        return { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } }
      }
      if (err instanceof usersService.UserAlreadyArchivedError) {
        set.status = 409
        return { success: false, data: null, error: { code: 'CONFLICT', message: err.message } }
      }
      throw err
    }
  })
