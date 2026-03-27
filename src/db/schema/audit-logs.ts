import { pgTable, uuid, varchar, jsonb, inet, timestamp, index } from 'drizzle-orm/pg-core'
import { branches } from './branches'
import { users } from './users'

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id),
    action: varchar('action', { length: 50 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    ipAddress: inet('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_audit_branch').on(t.branchId),
    index('idx_audit_actor').on(t.actorId),
    index('idx_audit_entity').on(t.entityType, t.entityId),
  ],
)
