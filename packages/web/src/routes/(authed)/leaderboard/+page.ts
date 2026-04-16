import type { PageLoad } from './$types'
import { api, unwrap } from '$lib/api/client'

export const load: PageLoad = async ({ fetch, url }) => {
  const months = url.searchParams.get('months') ?? ''
  const type = (url.searchParams.get('type') ?? 'bintang') as 'bintang' | 'poin_aha' | 'penalti'

  const leaderboardData = await api.api.v1.leaderboard.get({
    query: {
      type,
      ...(months ? { months: Number(months) } : {}),
      page: 1,
      limit: 50,
    },
    fetch,
  })

  return {
    leaderboard: unwrap(leaderboardData, 'Failed to load leaderboard'),
    months,
    type,
  }
}
