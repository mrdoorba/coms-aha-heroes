import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { listAuditLogsSchema } from '~/shared/schemas/audit'
import * as auditLogsService from '../services/audit-logs'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError, PaginationMeta } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const auditLogsRoute = new Hono<Env>()

  // GET / — list audit logs (HR/Admin)
  .get('/', zValidator('query', listAuditLogsSchema), async (c) => {
    const input = c.req.valid('query')
    const actor = c.get('authUser')
    const tx = c.get('tx')

    try {
      const result = await auditLogsService.listAuditLogs(input, { actor, tx })
      return c.json<ApiResponse<typeof result.logs> & { meta: PaginationMeta }>({
        success: true,
        data: result.logs,
        error: null,
        meta: result.meta,
      })
    } catch (err) {
      if (err instanceof auditLogsService.InsufficientRoleError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FORBIDDEN', message: err.message } },
          403,
        )
      }
      throw err
    }
  })
