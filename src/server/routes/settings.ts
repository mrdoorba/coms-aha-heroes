import { Elysia } from 'elysia'
import { updateSettingSchema } from '~/shared/schemas/settings'
import * as settingsService from '../services/settings'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'

type Ctx = { authUser: AuthUser; tx: DbClient }

export const settingsRoute = new Elysia({ prefix: '/settings' })

  // GET / — list all settings (admin only)
  .get('/', async ({ set, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    try {
      const data = await settingsService.listSettings({ actor, tx })
      return { success: true, data, error: null }
    } catch (err) {
      if (err instanceof settingsService.InsufficientRoleError) {
        set.status = 403
        return { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } }
      }
      throw err
    }
  })

  // PATCH / — update a setting (admin only)
  .patch('/', async ({ body, set, ...c }) => {
    const { authUser: actor, tx } = c as unknown as Ctx

    try {
      const data = await settingsService.updateSetting(body, { actor, tx })
      return { success: true, data, error: null }
    } catch (err) {
      if (err instanceof settingsService.InsufficientRoleError) {
        set.status = 403
        return { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } }
      }
      throw err
    }
  }, { body: updateSettingSchema })
