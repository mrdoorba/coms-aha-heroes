import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const LEADER_ROLES = ['admin', 'hr', 'leader']

export const load: PageServerLoad = async ({ locals, fetch, url }) => {
  if (!locals.user?.role || !LEADER_ROLES.includes(locals.user.role)) {
    redirect(302, '/dashboard')
  }

  const startDate = url.searchParams.get('startDate') ?? undefined
  const endDate = url.searchParams.get('endDate') ?? undefined
  const branchId = url.searchParams.get('branchId') ?? undefined

  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  if (branchId) params.set('branchId', branchId)

  const query = params.toString()
  const res = await fetch(`/api/v1/reports${query ? `?${query}` : ''}`)
  const json = await res.json()

  return {
    report: json.data as {
      totalBintang: number
      totalPenalti: number
      totalPoinAha: number
      totalUsers: number
      activeUsers: number
      pendingSubmissions: number
      topPerformers: Array<{ userId: string; name: string; bintangCount: number }>
      byBranch: Array<{ branchId: string; branchName: string; bintangCount: number }>
    } | null,
    filters: { startDate: startDate ?? null, endDate: endDate ?? null, branchId: branchId ?? null },
  }
}
