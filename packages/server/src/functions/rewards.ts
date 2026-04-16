import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '../api-client'
import type { CreateRewardInput, UpdateRewardInput } from '@coms/shared/schemas'

type ListRewardsParams = {
  page?: number
  limit?: number
}

type UpdateRewardParams = {
  id: string
} & UpdateRewardInput

export const listRewardsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListRewardsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.rewards.get({
      query: { page: data.page ?? 1, limit: data.limit ?? 20 } as any,
    })
    const res = unwrap(result, 'Failed to list rewards')
    return { rewards: res.data, meta: res.meta }
  })

export const getRewardByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.rewards({ id: data.id }).get()
    const res = unwrap(result, 'Failed to get reward')
    return res.data
  })

export const createRewardFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateRewardInput) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.rewards.post(data as any)
    const res = unwrap(result, 'Failed to create reward')
    return res.data
  })

export const updateRewardFn = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateRewardParams) => data)
  .handler(async ({ data }) => {
    const { id, ...input } = data
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.rewards({ id }).patch(input as any)
    const res = unwrap(result, 'Failed to update reward')
    return res.data
  })
