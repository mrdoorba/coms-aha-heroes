import { z } from 'zod'
import { KITTA_CODES, POINT_STATUSES, POINT_CATEGORY_CODES } from '../constants'

export const submitPointSchema = z
  .object({
    userId: z.string().uuid(),
    categoryCode: z.enum(POINT_CATEGORY_CODES),
    points: z.number().int().min(1).max(10),
    reason: z.string().min(1).max(1000),
    relatedStaff: z.string().max(500).optional(),
    screenshotUrl: z.string().url().optional(),
    kittaComponent: z.enum(KITTA_CODES).optional(),
  })
  .refine(
    (data) => {
      if (data.categoryCode === 'PENALTI') return data.kittaComponent != null
      return true
    },
    { message: 'KITTA component is required for Penalti', path: ['kittaComponent'] },
  )
  .refine(
    (data) => {
      if (data.categoryCode !== 'PENALTI') return data.kittaComponent == null
      return true
    },
    { message: 'KITTA component is only for Penalti', path: ['kittaComponent'] },
  )
  .refine(
    (data) => {
      if (data.categoryCode === 'BINTANG') return data.points === 1
      return true
    },
    { message: 'Bintang is always 1 point', path: ['points'] },
  )

export const listPointsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryCode: z.enum(POINT_CATEGORY_CODES).optional(),
  status: z.enum(POINT_STATUSES).optional(),
  userId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
})

export const approveRejectSchema = z.object({
  reason: z.string().max(500).optional(),
})

export type SubmitPointInput = z.infer<typeof submitPointSchema>
export type ListPointsInput = z.infer<typeof listPointsSchema>
export type ApproveRejectInput = z.infer<typeof approveRejectSchema>
