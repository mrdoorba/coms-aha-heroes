import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

type RequestRedemptionParams = {
  rewardId: string
  notes?: string
}

type ListRedemptionsParams = {
  page?: number
  limit?: number
  status?: string
  mine?: boolean
}

type ResolveRedemptionParams = {
  id: string
  rejectionReason?: string
}

export const requestRedemptionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: RequestRedemptionParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(`${getBaseUrl(request)}/api/v1/redemptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({ rewardId: data.rewardId, notes: data.notes }),
    })

    const result = await response.json()
    if (!response.ok)
      throw new Error(result.error?.message ?? 'Failed to request redemption')
    return result.data
  })

export const listRedemptionsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListRedemptionsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const params = new URLSearchParams()
    params.set('page', String(data.page ?? 1))
    params.set('limit', String(data.limit ?? 20))
    if (data.status) params.set('status', data.status)
    if (data.mine !== undefined) params.set('mine', String(data.mine))

    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/redemptions?${params.toString()}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok)
      throw new Error(result.error?.message ?? 'Failed to list redemptions')
    return { redemptions: result.data, meta: result.meta }
  })

export const getRedemptionByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/redemptions/${data.id}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok)
      throw new Error(result.error?.message ?? 'Failed to get redemption')
    return result.data
  })

export const approveRedemptionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/redemptions/${data.id}/approve`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
      },
    )

    const result = await response.json()
    if (!response.ok)
      throw new Error(result.error?.message ?? 'Failed to approve redemption')
    return result.data
  })

export const rejectRedemptionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ResolveRedemptionParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/redemptions/${data.id}/reject`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: data.rejectionReason,
        }),
      },
    )

    const result = await response.json()
    if (!response.ok)
      throw new Error(result.error?.message ?? 'Failed to reject redemption')
    return result.data
  })

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}
