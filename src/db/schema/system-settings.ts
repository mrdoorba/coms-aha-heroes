import { pgTable, uuid, varchar, jsonb, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const systemSettings = pgTable('system_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
