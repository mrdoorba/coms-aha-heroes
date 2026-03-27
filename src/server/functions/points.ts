import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/server/auth'
import { db } from '~/db'
import { users, pointCategories, pointCategoryTranslations } from '~/db/schema'
import { eq, and, ilike, asc } from 'drizzle-orm'

type ListPointsParams = {
  page?: number
  limit?: number
  categoryCode?: string
  status?: string
  teamId?: string
}

type SubmitPointParams = {
  userId: string
  categoryCode: string
  points: number
  reason: string
  relatedStaff?: string
  screenshotUrl?: string
  kittaComponent?: string
}

export const listPointsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListPointsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const params = new URLSearchParams()
    params.set('page', String(data.page ?? 1))
    params.set('limit', String(data.limit ?? 20))
    if (data.categoryCode) params.set('categoryCode', data.categoryCode)
    if (data.status) params.set('status', data.status)
    if (data.teamId) params.set('teamId', data.teamId)

    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/points?${params.toString()}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to list points')
    return { points: result.data, meta: result.meta }
  })

export const getPointByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/points/${data.id}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to get point')
    return result.data
  })

export const submitPointFn = createServerFn({ method: 'POST' })
  .inputValidator((data: SubmitPointParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(`${getBaseUrl(request)}/api/v1/points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to submit point')
    return result.data
  })

export const getPointsLookupDataFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Not authenticated')

    const [employeeRows, categoryRows, translationRows] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          teamId: users.teamId,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.isActive, true))
        .orderBy(asc(users.name)),
      db.select().from(pointCategories).orderBy(asc(pointCategories.code)),
      db.select().from(pointCategoryTranslations),
    ])

    const categories = categoryRows.map((cat) => ({
      ...cat,
      translations: translationRows.filter((t) => t.categoryId === cat.id),
    }))

    return { employees: employeeRows, categories }
  },
)

export const searchEmployeesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { search: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Not authenticated')

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        teamId: users.teamId,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          ilike(users.name, `%${data.search}%`),
        ),
      )
      .orderBy(asc(users.name))
      .limit(10)

    return rows
  })

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}
