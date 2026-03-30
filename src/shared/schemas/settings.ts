import { z } from 'zod'

export const listSettingsSchema = z.object({})

export const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(),
})

export type ListSettingsInput = z.infer<typeof listSettingsSchema>
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>
