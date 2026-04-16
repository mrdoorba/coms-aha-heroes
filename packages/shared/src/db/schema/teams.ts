import { pgTable, uuid, varchar, timestamp, index, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { branches } from './branches'
import { users } from './users'

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    name: varchar('name', { length: 100 }).notNull(),
    leaderId: uuid('leader_id').references((): AnyPgColumn => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_teams_branch').on(t.branchId),
    index('idx_teams_leader').on(t.leaderId),
  ],
)
