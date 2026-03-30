import * as auditLogsRepo from '../repositories/audit-logs'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ListAuditLogsInput } from '~/shared/schemas/audit'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
}

export async function listAuditLogs(input: ListAuditLogsInput, ctx: ServiceContext) {
  if (ctx.actor.role !== 'admin' && ctx.actor.role !== 'hr') {
    throw new InsufficientRoleError()
  }

  // Admin sees all branches, HR sees only their own branch
  const branchId = ctx.actor.role === 'admin' ? null : ctx.actor.branchId

  const { rows, total } = await auditLogsRepo.listAuditLogs(input, branchId, ctx.tx)

  return {
    logs: rows,
    meta: { total, page: input.page, limit: input.limit },
  }
}

export class InsufficientRoleError extends Error {
  constructor() {
    super('Insufficient role for this action')
    this.name = 'InsufficientRoleError'
  }
}
