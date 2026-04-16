import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '../api-client'

type RequestRedemptionParams = {
  rewardId: string
  notes?: string
}

type ListRedemptionsParams = {
  page?: number
  limit?: number
  status?: string
  mine?: boolean
  search?: string
  dateFrom?: string
  dateTo?: string
}

type ResolveRedemptionParams = {
  id: string
  rejectionReason?: string
}

export const requestRedemptionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: RequestRedemptionParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.redemptions.post({
      rewardId: data.rewardId,
      notes: data.notes,
    } as any)
    const res = unwrap(result, 'Failed to request redemption')
    return res.data
  })

export const listRedemptionsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListRedemptionsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.redemptions.get({
      query: {
        page: data.page ?? 1,
        limit: data.limit ?? 20,
        ...(data.status ? { status: data.status } : {}),
        ...(data.mine !== undefined ? { mine: data.mine } : {}),
        ...(data.search ? { search: data.search } : {}),
        ...(data.dateFrom ? { dateFrom: data.dateFrom } : {}),
        ...(data.dateTo ? { dateTo: data.dateTo } : {}),
      } as any,
    })
    const res = unwrap(result, 'Failed to list redemptions')
    return { redemptions: res.data, meta: res.meta }
  })

export const getRedemptionByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.redemptions({ id: data.id }).get()
    const res = unwrap(result, 'Failed to get redemption')
    return res.data
  })

export const approveRedemptionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.redemptions({ id: data.id }).approve.patch({} as any)
    const res = unwrap(result, 'Failed to approve redemption')
    return res.data
  })

export const rejectRedemptionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ResolveRedemptionParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.redemptions({ id: data.id }).reject.patch({
      status: 'rejected',
      rejectionReason: data.rejectionReason,
    } as any)
    const res = unwrap(result, 'Failed to reject redemption')
    return res.data
  })

export const bulkResolveRedemptionsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { ids: string[]; action: 'approve' | 'reject'; rejectionReason?: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.redemptions.bulk.post(data as any)
    const res = unwrap(result, 'Failed to bulk resolve redemptions')
    return res.data
  })
