import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '~/lib/api-client'

type ListAuditLogsParams = {
  page?: number
  limit?: number
  action?: string
  entityType?: string
  actorId?: string
  startDate?: string
  endDate?: string
}

export const listAuditLogsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListAuditLogsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1['audit-logs'].get({
      query: {
        page: data.page ?? 1,
        limit: data.limit ?? 50,
        ...(data.action ? { action: data.action } : {}),
        ...(data.entityType ? { entityType: data.entityType } : {}),
        ...(data.actorId ? { actorId: data.actorId } : {}),
        ...(data.startDate ? { startDate: data.startDate } : {}),
        ...(data.endDate ? { endDate: data.endDate } : {}),
      } as any,
    })
    const res = unwrap(result, 'Failed to list audit logs')
    return { logs: res.data, meta: res.meta }
  })
