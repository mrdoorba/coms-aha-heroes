import { z } from 'zod'

export const listAuditLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().optional(),
  entityType: z.string().optional(),
  actorId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>
