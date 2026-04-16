import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '../api-client'
import type { DashboardSummary, ActivityItem } from '../services/dashboard'

export const getDashboardSummaryFn = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const api = createServerApi(request)

  const result = await api.api.v1.dashboard.summary.get()
  const data = unwrap(result, 'Failed to load dashboard summary')
  return data.data as DashboardSummary
})

export const getDashboardActivityFn = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const api = createServerApi(request)

  const result = await api.api.v1.dashboard.activity.get()
  const data = unwrap(result, 'Failed to load dashboard activity')
  return data.data as ActivityItem[]
})
