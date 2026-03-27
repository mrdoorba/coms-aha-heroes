import { z } from 'zod'

const ENTITY_TYPES = ['achievement', 'challenge', 'appeal'] as const

export const createCommentSchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  entityId: z.string().uuid(),
  body: z.string().min(1).max(5000),
})

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(5000),
})

export const listCommentsSchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  entityId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
export type ListCommentsInput = z.infer<typeof listCommentsSchema>
