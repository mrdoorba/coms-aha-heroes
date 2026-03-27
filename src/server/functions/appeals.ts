import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

type FileAppealParams = {
  pointId: string
  reason: string
}

type ResolveAppealParams = {
  appealId: string
  status: string
  resolutionNote: string
}

type ListAppealsParams = {
  pointId: string
  page?: number
  limit?: number
}

export const listAppealsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListAppealsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const params = new URLSearchParams()
    params.set('page', String(data.page ?? 1))
    params.set('limit', String(data.limit ?? 20))

    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/points/${data.pointId}/appeals?${params.toString()}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to list appeals')
    return { appeals: result.data, meta: result.meta }
  })

export const fileAppealFn = createServerFn({ method: 'POST' })
  .inputValidator((data: FileAppealParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/points/${data.pointId}/appeals`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({ reason: data.reason }),
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to file appeal')
    return result.data
  })

export const resolveAppealFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ResolveAppealParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/appeals/${data.appealId}/resolve`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({
          status: data.status,
          resolutionNote: data.resolutionNote,
        }),
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to resolve appeal')
    return result.data
  })

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}
