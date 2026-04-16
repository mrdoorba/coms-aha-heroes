import type { PageLoad } from './$types'
import { api, unwrap } from '$lib/api/client'

export const load: PageLoad = async ({ fetch }) => {
  const [summaryRes, activityRes] = await Promise.all([
    api.api.v1.dashboard.summary.get({ fetch }),
    api.api.v1.dashboard.activity.get({ fetch }),
  ])

  return {
    summary: unwrap(summaryRes, 'Failed to load dashboard summary'),
    activity: unwrap(activityRes, 'Failed to load recent activity'),
  }
}
