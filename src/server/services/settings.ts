import * as settingsRepo from '../repositories/settings'
import type { AuthUser } from '../middleware/auth'
import { withRLS } from '../repositories/base'
import type { UpdateSettingInput } from '~/shared/schemas/settings'

type ServiceContext = {
  readonly actor: AuthUser
  readonly ipAddress?: string
}

export async function listSettings(ctx: ServiceContext) {
  if (ctx.actor.role !== 'admin') {
    throw new InsufficientRoleError()
  }
  return withRLS(ctx.actor, (db) => settingsRepo.getAllSettings(db))
}

export async function updateSetting(input: UpdateSettingInput, ctx: ServiceContext) {
  if (ctx.actor.role !== 'admin') {
    throw new InsufficientRoleError()
  }
  return withRLS(ctx.actor, (db) =>
    settingsRepo.upsertSetting(input.key, input.value, ctx.actor.id, db),
  )
}

export class InsufficientRoleError extends Error {
  constructor() {
    super('Insufficient role for this action')
    this.name = 'InsufficientRoleError'
  }
}
