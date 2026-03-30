import { z } from 'zod'

export const reportsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  branchId: z.string().uuid().optional(),
})

export type ReportsQueryInput = z.infer<typeof reportsQuerySchema>
