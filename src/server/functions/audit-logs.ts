import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

type ListAuditLogsParams = {
  page?: number
  limit?: number
  action?: string
  entityType?: string
  actorId?: string
  startDate?: string
  endDate?: string
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

export const listAuditLogsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListAuditLogsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const params = new URLSearchParams()
    params.set('page', String(data.page ?? 1))
    params.set('limit', String(data.limit ?? 50))
    if (data.action) params.set('action', data.action)
    if (data.entityType) params.set('entityType', data.entityType)
    if (data.actorId) params.set('actorId', data.actorId)
    if (data.startDate) params.set('startDate', data.startDate)
    if (data.endDate) params.set('endDate', data.endDate)

    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/audit-logs?${params.toString()}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to list audit logs')
    return { logs: result.data, meta: result.meta }
  })
