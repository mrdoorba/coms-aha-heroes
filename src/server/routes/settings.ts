import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { updateSettingSchema } from '~/shared/schemas/settings'
import * as settingsService from '../services/settings'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const settingsRoute = new Hono<Env>()

  // GET / — list all settings (admin only)
  .get('/', async (c) => {
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const data = await settingsService.listSettings({ actor, tx })
      return c.json<ApiResponse<typeof data>>({
        success: true,
        data,
        error: null,
      })
    } catch (err) {
      if (err instanceof settingsService.InsufficientRoleError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } },
          403,
        )
      }
      throw err
    }
  })

  // PATCH / — update a setting (admin only)
  .patch('/', zValidator('json', updateSettingSchema), async (c) => {
    const input = c.req.valid('json')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const data = await settingsService.updateSetting(input, { actor, tx })
      return c.json<ApiResponse<typeof data>>({
        success: true,
        data,
        error: null,
      })
    } catch (err) {
      if (err instanceof settingsService.InsufficientRoleError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } },
          403,
        )
      }
      throw err
    }
  })
