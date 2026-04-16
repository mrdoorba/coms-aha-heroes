import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
  const actor = locals.user!
  const [pointsService, challengesService, appealsService] = await Promise.all([
    import('@coms/server/services/points'),
    import('@coms/server/services/challenges'),
    import('@coms/server/services/appeals'),
  ])

  let point
  try {
    point = await pointsService.getPointById(params.id, { actor })
  } catch {
    error(404, 'Point not found')
  }

  const [challengesResult, appealsResult] = await Promise.all([
    challengesService.listChallenges(params.id, { page: 1, limit: 100 }, { actor }),
    appealsService.listAppeals(params.id, { page: 1, limit: 100 }, { actor }),
  ])

  return {
    point,
    challenges: challengesResult.challenges,
    appeals: appealsResult.appeals,
  }
}
