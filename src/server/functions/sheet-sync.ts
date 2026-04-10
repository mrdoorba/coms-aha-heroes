import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '~/lib/api-client'

type ListJobsParams = {
  page?: number
  limit?: number
}

export const getSyncStatusFn = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const api = createServerApi(request)

  const result = await api.api.v1['sheet-sync'].status.get()
  const res = unwrap(result, 'Failed to get sync status')
  return res.data
})

export const listSyncJobsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListJobsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1['sheet-sync'].jobs.get({
      query: {
        page: data.page ?? 1,
        limit: data.limit ?? 20,
      } as any,
    })
    const res = unwrap(result, 'Failed to list sync jobs')
    return { jobs: res.data, meta: res.meta }
  })

export const getSyncJobFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1['sheet-sync'].jobs({ id: data.id }).get()
    const res = unwrap(result, 'Failed to get sync job')
    return res.data
  })

export const triggerSyncFn = createServerFn({ method: 'POST' }).handler(async () => {
  const request = getRequest()
  const api = createServerApi(request)

  const result = await api.api.v1['sheet-sync'].trigger.post({})
  const res = unwrap(result, 'Failed to trigger sync')
  return res.data
})

export const triggerResyncFn = createServerFn({ method: 'POST' }).handler(async () => {
  const request = getRequest()
  const api = createServerApi(request)

  const result = await api.api.v1['sheet-sync'].resync.post({})
  const res = unwrap(result, 'Failed to trigger resync')
  return res.data
})
