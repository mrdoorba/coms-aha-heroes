import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  branchId: z.string().uuid(),
  leaderId: z.string().uuid().nullable().optional(),
})

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  leaderId: z.string().uuid().nullable().optional(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
