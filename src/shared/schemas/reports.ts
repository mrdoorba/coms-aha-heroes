import { Type as t, type Static } from '@sinclair/typebox'

export const reportsQuerySchema = t.Object({
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  branchId: t.Optional(t.String({ format: 'uuid' })),
})

export type ReportsQueryInput = Static<typeof reportsQuerySchema>
