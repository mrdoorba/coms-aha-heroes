import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  timezone: varchar('timezone', { length: 50 }).notNull().default('Asia/Jakarta'),
  locale: varchar('locale', { length: 10 }).notNull().default('id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
