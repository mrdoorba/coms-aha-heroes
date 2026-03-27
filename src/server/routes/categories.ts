import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { rbacMiddleware } from '../middleware/rbac'
import * as categoriesRepo from '../repositories/categories'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

const toggleSchema = z.object({
  isActive: z.boolean(),
})

export const categoriesRoute = new Hono<Env>()

  // GET /categories — list all with translations (any authenticated user)
  .get('/', async (c) => {
    const tx = c.get('tx')
    const locale = c.req.query('locale')

    const categories = await categoriesRepo.listCategories(tx)

    const data = categories.map((cat) => {
      const translation = locale
        ? cat.translations.find((t) => t.locale === locale)
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

    return c.json<ApiResponse<typeof data>>({
      success: true,
      data,
      error: null,
    })
  })

  // PATCH /categories/:id — toggle active (admin only)
  .patch(
    '/:id',
    rbacMiddleware(['admin']),
    zValidator('json', toggleSchema),
    async (c) => {
      const id = c.req.param('id')
      const { isActive } = c.req.valid('json')
      const tx = c.get('tx')

      const existing = await categoriesRepo.getCategoryById(id, tx)
      if (!existing) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: `Category not found: ${id}` } },
          404,
        )
      }

      const updated = await categoriesRepo.toggleCategoryActive(id, isActive, tx)

      return c.json<ApiResponse<typeof updated>>({
        success: true,
        data: updated,
        error: null,
      })
    },
  )
