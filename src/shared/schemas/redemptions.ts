import { z } from 'zod'
import { REDEMPTION_STATUSES } from '../constants'

const resolvableStatuses = REDEMPTION_STATUSES.filter((s) => s !== 'pending') as [
  string,
  ...string[],
]

export const requestRedemptionSchema = z.object({
  rewardId: z.string().uuid(),
  notes: z.string().max(500).optional(),
})

export const listRedemptionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(REDEMPTION_STATUSES).optional(),
  mine: z.coerce.boolean().optional(),
})

export const resolveRedemptionSchema = z
  .object({
    status: z.enum(resolvableStatuses),
    rejectionReason: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.status !== 'rejected' || !!data.rejectionReason,
    {
      message: 'rejectionReason is required when status is rejected',
      path: ['rejectionReason'],
    },
  )

export type RequestRedemptionInput = z.infer<typeof requestRedemptionSchema>
export type ListRedemptionsInput = z.infer<typeof listRedemptionsSchema>
export type ResolveRedemptionInput = z.infer<typeof resolveRedemptionSchema>
