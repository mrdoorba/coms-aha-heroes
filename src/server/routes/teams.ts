import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { rbacMiddleware } from '../middleware/rbac'
import {
  createTeamSchema,
  updateTeamSchema,
  listTeamsSchema,
} from '~/shared/schemas/teams'
import * as teamsService from '../services/teams'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const teamsRoute = new Hono<Env>()
  // All team routes require admin or hr
  .use('/*', rbacMiddleware(['admin', 'hr']))

  // GET /teams — list with search + pagination
  .get('/', zValidator('query', listTeamsSchema), async (c) => {
    const input = c.req.valid('query')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    const result = await teamsService.listTeams(input, {
      actor,
      tx,
    })

    return c.json<ApiResponse<typeof result.teams> & { meta: PaginationMeta }>({
      success: true,
      data: result.teams,
      error: null,
      meta: result.meta,
    })
  })

  // GET /teams/:id — single team with members
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const team = await teamsService.getTeamById(id, { actor, tx })
      return c.json<ApiResponse<typeof team>>({
        success: true,
        data: team,
        error: null,
      })
    } catch (err) {
      if (err instanceof teamsService.TeamNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } },
          404,
        )
      }
      throw err
    }
  })

  // POST /teams — create new team
  .post('/', zValidator('json', createTeamSchema), async (c) => {
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    const created = await teamsService.createTeam(input, {
      actor,
      tx,
      ipAddress,
    })
    return c.json<ApiResponse<typeof created>>(
      { success: true, data: created, error: null },
      201,
    )
  })

  // PATCH /teams/:id — update team
  .patch('/:id', zValidator('json', updateTeamSchema), async (c) => {
    const id = c.req.param('id')
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')
    const ipAddress = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip')

    try {
      const updated = await teamsService.updateTeam(id, input, {
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
      if (err instanceof teamsService.TeamNotFoundError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } },
          404,
        )
      }
      throw err
    }
  })
