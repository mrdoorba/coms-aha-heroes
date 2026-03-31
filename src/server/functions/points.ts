import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '~/lib/api-client'
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
  search?: string
  submittedBy?: string
  dateFrom?: string
  dateTo?: string
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
    const api = createServerApi(request)

    const result = await api.api.v1.points.get({
      query: {
        page: data.page ?? 1,
        limit: data.limit ?? 20,
        ...(data.categoryCode ? { categoryCode: data.categoryCode } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.teamId ? { teamId: data.teamId } : {}),
        ...(data.search ? { search: data.search } : {}),
        ...(data.submittedBy ? { submittedBy: data.submittedBy } : {}),
        ...(data.dateFrom ? { dateFrom: data.dateFrom } : {}),
        ...(data.dateTo ? { dateTo: data.dateTo } : {}),
      } as any,
    })
    const res = unwrap(result, 'Failed to list points')
    return { points: res.data, meta: res.meta }
  })

export const getPointByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.points({ id: data.id }).get()
    const res = unwrap(result, 'Failed to get point')
    return res.data
  })

export const submitPointFn = createServerFn({ method: 'POST' })
  .inputValidator((data: SubmitPointParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.points.post(data as any)
    const res = unwrap(result, 'Failed to submit point')
    return res.data
  })

// Pattern B — Direct DB access (no API call)
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

// Pattern B — Direct DB access (no API call)
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
