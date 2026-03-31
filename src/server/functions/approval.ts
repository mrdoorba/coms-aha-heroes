import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '~/lib/api-client'

type ApprovalParams = {
  pointId: string
  reason?: string
}

export const bulkResolvePointsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { ids: string[]; action: 'approve' | 'reject'; reason?: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.points.bulk.post(data as any)
    const res = unwrap(result, 'Failed to bulk resolve points')
    return res.data
  })

export const approvePointFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ApprovalParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.points({ id: data.pointId }).approve.patch(
      { reason: data.reason } as any,
    )
    const res = unwrap(result, 'Failed to approve point')
    return res.data
  })

export const rejectPointFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ApprovalParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.points({ id: data.pointId }).reject.patch(
      { reason: data.reason } as any,
    )
    const res = unwrap(result, 'Failed to reject point')
    return res.data
  })

export const revokePointFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ApprovalParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.points({ id: data.pointId }).revoke.patch(
      { reason: data.reason } as any,
    )
    const res = unwrap(result, 'Failed to revoke point')
    return res.data
  })
