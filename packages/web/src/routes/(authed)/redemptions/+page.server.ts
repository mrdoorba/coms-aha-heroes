import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const actor = locals.user!
  const redemptionsService = await import('@coms/server/services/redemptions')
  const result = await redemptionsService.listRedemptions(
    { page: 1, limit: 50, mine: true },
    { actor },
  )
  return {
    redemptions: { data: result.redemptions, meta: result.meta },
  }
}
