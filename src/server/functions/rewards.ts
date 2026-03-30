import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import type { CreateRewardInput, UpdateRewardInput } from '~/shared/schemas/rewards'

type ListRewardsParams = {
  page?: number
  limit?: number
}

type GetRewardByIdParams = {
  id: string
}

type UpdateRewardParams = {
  id: string
} & UpdateRewardInput

export const listRewardsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListRewardsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const params = new URLSearchParams()
    params.set('page', String(data.page ?? 1))
    params.set('limit', String(data.limit ?? 20))

    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/rewards?${params.toString()}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to list rewards')
    return { rewards: result.data, meta: result.meta }
  })

export const getRewardByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: GetRewardByIdParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()

    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/rewards/${data.id}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to get reward')
    return result.data
  })

export const createRewardFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateRewardInput) => data)
  .handler(async ({ data }) => {
    const request = getRequest()

    const response = await fetch(`${getBaseUrl(request)}/api/v1/rewards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to create reward')
    return result.data
  })

export const updateRewardFn = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateRewardParams) => data)
  .handler(async ({ data }) => {
    const { id, ...input } = data
    const request = getRequest()

    const response = await fetch(`${getBaseUrl(request)}/api/v1/rewards/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(input),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to update reward')
    return result.data
  })

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}
