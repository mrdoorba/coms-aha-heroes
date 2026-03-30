import * as settingsRepo from '../repositories/settings'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { UpdateSettingInput } from '~/shared/schemas/settings'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
  readonly ipAddress?: string
}

export async function listSettings(ctx: ServiceContext) {
  if (ctx.actor.role !== 'admin') {
    throw new InsufficientRoleError()
  }
  return settingsRepo.getAllSettings(ctx.tx)
}

export async function updateSetting(input: UpdateSettingInput, ctx: ServiceContext) {
  if (ctx.actor.role !== 'admin') {
    throw new InsufficientRoleError()
  }
  return settingsRepo.upsertSetting(input.key, input.value, ctx.actor.id, ctx.tx)
}

export class InsufficientRoleError extends Error {
  constructor() {
    super('Insufficient role for this action')
    this.name = 'InsufficientRoleError'
  }
}
