import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import type { DashboardSummary, ActivityItem } from '../services/dashboard'

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

export const getDashboardSummaryFn = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const response = await fetch(`${getBaseUrl(request)}/api/v1/dashboard/summary`, {
    headers: { Cookie: request.headers.get('cookie') ?? '' },
  })

  const result = await response.json()
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load dashboard summary')
  return result.data as DashboardSummary
})

export const getDashboardActivityFn = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const response = await fetch(`${getBaseUrl(request)}/api/v1/dashboard/activity`, {
    headers: { Cookie: request.headers.get('cookie') ?? '' },
  })

  const result = await response.json()
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load dashboard activity')
  return result.data as ActivityItem[]
})
