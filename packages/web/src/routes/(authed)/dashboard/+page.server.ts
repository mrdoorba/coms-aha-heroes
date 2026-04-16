import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const actor = locals.user!
  const dashboardService = await import('@coms/server/services/dashboard')
  const [summary, activity] = await Promise.all([
    dashboardService.getSummary({ actor }),
    dashboardService.getRecentActivity({ actor }),
  ])
  return { summary, activity }
}
