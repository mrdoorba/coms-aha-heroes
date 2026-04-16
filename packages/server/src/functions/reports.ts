import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '../api-client'

type ReportsQueryParams = {
  startDate?: string
  endDate?: string
  branchId?: string
}

export const getReportsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ReportsQueryParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.reports.get({ query: data as any })
    const res = unwrap(result, 'Failed to fetch reports')
    return res.data
  })
