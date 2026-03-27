import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { userRoleEnum } from './enums'
import { branches } from './branches'
import { teams } from './teams'

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    teamId: uuid('team_id').references((): AnyPgColumn => teams.id),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    employeeId: varchar('employee_id', { length: 50 }),
    role: userRoleEnum('role').notNull().default('employee'),
    department: varchar('department', { length: 100 }),
    position: varchar('position', { length: 100 }),
    avatarUrl: text('avatar_url'),
    localePref: varchar('locale_pref', { length: 10 }),
    mustChangePassword: boolean('must_change_password').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_users_branch').on(t.branchId),
    index('idx_users_team').on(t.teamId),
    index('idx_users_email').on(t.email),
  ],
)
