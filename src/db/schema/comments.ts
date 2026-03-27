import { pgTable, uuid, varchar, text, timestamp, index, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { branches } from './branches'
import { users } from './users'

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    entityType: varchar('entity_type', { length: 30 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_comments_entity').on(t.entityType, t.entityId),
    index('idx_comments_branch').on(t.branchId),
    check(
      'chk_entity_type',
      sql`entity_type IN ('achievement', 'challenge', 'appeal')`,
    ),
  ],
)
