import { pgTable, uuid, text, varchar, timestamp, index, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { branches } from './branches'
import { achievementPoints } from './achievement-points'
import { users } from './users'

export const appeals = pgTable(
  'appeals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    achievementId: uuid('achievement_id')
      .notNull()
      .references(() => achievementPoints.id),
    appellantId: uuid('appellant_id')
      .notNull()
      .references(() => users.id),
    reason: text('reason').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('open'),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNote: text('resolution_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_appeals_achievement').on(t.achievementId),
    index('idx_appeals_branch').on(t.branchId),
    check(
      'chk_appeal_status',
      sql`status IN ('open', 'upheld', 'overturned')`,
    ),
  ],
)
