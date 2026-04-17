import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
  const actor = locals.user!
  const page = Number(url.searchParams.get('page') ?? '1')
  const status = url.searchParams.get('status') ?? undefined
  const category = url.searchParams.get('category') ?? undefined

  const pointsService = await import('@coms/server/services/points')
  const result = await pointsService.listPoints(
    {
      page,
      limit: 20,
      ...(status ? { status: status as any } : {}),
      ...(category ? { categoryCode: category as any } : {}),
    },
    { actor },
  )

  return {
    points: result.points,
    meta: { ...result.meta, page },
    status: status ?? '',
    category: category ?? '',
  }
}
