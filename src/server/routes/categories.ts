import { Elysia, t } from 'elysia'
import { requireRole } from '../middleware/rbac'
import * as categoriesRepo from '../repositories/categories'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'

type Ctx = { authUser: AuthUser; tx: DbClient }

const toggleSchema = t.Object({
  isActive: t.Boolean(),
})

export const categoriesRoute = new Elysia({ prefix: '/categories' })

  // GET /categories — list all with translations (any authenticated user)
  .get('/', async ({ query, ...c }) => {
    const { tx } = c as unknown as Ctx
    const locale = query.locale

    const categories = await categoriesRepo.listCategories(tx)

    const data = categories.map((cat) => {
      const translation = locale
        ? cat.translations.find((tr) => tr.locale === locale)
        : undefined

      return {
        id: cat.id,
        code: cat.code,
        name: translation?.name ?? cat.defaultName,
        description: translation?.description ?? cat.description,
        icon: cat.icon,
        requiresScreenshot: cat.requiresScreenshot,
        isActive: cat.isActive,
      }
    })

    return { success: true, data, error: null }
  }, {
    query: t.Object({
      locale: t.Optional(t.String()),
    }),
  })

  // PATCH /categories/:id — toggle active (admin only)
  .patch('/:id', async ({ params, body, set, ...c }) => {
    const { tx } = c as unknown as Ctx
    requireRole('admin')(c as any)

    const existing = await categoriesRepo.getCategoryById(params.id, tx)
    if (!existing) {
      set.status = 404
      return { success: false, data: null, error: { code: 'NOT_FOUND', message: `Category not found: ${params.id}` } }
    }

    const updated = await categoriesRepo.toggleCategoryActive(params.id, body.isActive, tx)

    return { success: true, data: updated, error: null }
  }, { body: toggleSchema })
