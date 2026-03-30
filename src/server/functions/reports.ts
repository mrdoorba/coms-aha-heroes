import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

type ReportsQueryParams = {
  startDate?: string
  endDate?: string
  branchId?: string
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

export const getReportsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ReportsQueryParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const params = new URLSearchParams()
    if (data.startDate) params.set('startDate', data.startDate)
    if (data.endDate) params.set('endDate', data.endDate)
    if (data.branchId) params.set('branchId', data.branchId)

    const query = params.toString()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/reports${query ? `?${query}` : ''}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to fetch reports')
    return result.data
  })
