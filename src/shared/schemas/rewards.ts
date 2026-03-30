import { z } from 'zod'

export const listRewardsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const createRewardSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  pointCost: z.number().int().min(1),
  imageUrl: z.string().url().optional(),
})

export const updateRewardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  pointCost: z.number().int().min(1).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
})

export type ListRewardsInput = z.infer<typeof listRewardsSchema>
export type CreateRewardInput = z.infer<typeof createRewardSchema>
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>
