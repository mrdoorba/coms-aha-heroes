import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

type ApprovalParams = {
  pointId: string
  reason?: string
}

export const bulkResolvePointsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { ids: string[]; action: 'approve' | 'reject'; reason?: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(`${getBaseUrl(request)}/api/v1/points/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to bulk resolve points')
    return result.data
  })

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

export const approvePointFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ApprovalParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/points/${data.pointId}/approve`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({ reason: data.reason }),
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to approve point')
    return result.data
  })

export const rejectPointFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ApprovalParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/points/${data.pointId}/reject`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({ reason: data.reason }),
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to reject point')
    return result.data
  })

export const revokePointFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ApprovalParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/points/${data.pointId}/revoke`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({ reason: data.reason }),
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to revoke point')
    return result.data
  })
