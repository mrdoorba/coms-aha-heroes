import { z } from 'zod'

export const bulkRedemptionActionSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(100),
    action: z.enum(['approve', 'reject']),
    rejectionReason: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.action !== 'reject' || !!data.rejectionReason,
    { message: 'rejectionReason is required when rejecting', path: ['rejectionReason'] },
  )

export const bulkPointActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
})

export const bulkUserActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['archive', 'activate']),
})

export type BulkResultItem = { id: string; success: boolean; error?: string }
export type BulkResult = {
  processed: number
  succeeded: number
  failed: number
  results: BulkResultItem[]
}

export type BulkRedemptionActionInput = z.infer<typeof bulkRedemptionActionSchema>
export type BulkPointActionInput = z.infer<typeof bulkPointActionSchema>
export type BulkUserActionInput = z.infer<typeof bulkUserActionSchema>
