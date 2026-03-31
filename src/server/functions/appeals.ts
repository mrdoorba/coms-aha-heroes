import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '~/lib/api-client'

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
    const api = createServerApi(request)

    const result = await api.api.v1.points({ id: data.pointId }).appeals.get({
      query: { page: data.page ?? 1, limit: data.limit ?? 20 } as any,
    })
    const res = unwrap(result, 'Failed to list appeals')
    return { appeals: res.data, meta: res.meta }
  })

export const fileAppealFn = createServerFn({ method: 'POST' })
  .inputValidator((data: FileAppealParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.points({ id: data.pointId }).appeals.post(
      { reason: data.reason } as any,
    )
    const res = unwrap(result, 'Failed to file appeal')
    return res.data
  })

export const resolveAppealFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ResolveAppealParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.appeals({ id: data.appealId }).resolve.patch({
      status: data.status,
      resolutionNote: data.resolutionNote,
    } as any)
    const res = unwrap(result, 'Failed to resolve appeal')
    return res.data
  })
