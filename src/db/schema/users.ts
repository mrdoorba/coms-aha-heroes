import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
  index,
  uniqueIndex,
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
    attendanceName: varchar('attendance_name', { length: 50 }),
    role: userRoleEnum('role').notNull().default('employee'),
    department: varchar('department', { length: 100 }),
    position: varchar('position', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    employmentStatus: varchar('employment_status', { length: 20 }),
    talentaId: varchar('talenta_id', { length: 50 }),
    avatarUrl: text('avatar_url'),
    localePref: varchar('locale_pref', { length: 10 }),
    mustChangePassword: boolean('must_change_password').notNull().default(true),
    canSubmitPoints: boolean('can_submit_points').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_users_branch').on(t.branchId),
    index('idx_users_team').on(t.teamId),
    index('idx_users_email').on(t.email),
    index('idx_users_attendance_name').on(t.attendanceName),
    uniqueIndex('idx_users_talenta_id').on(t.talentaId),
  ],
)

export const userEmails = pgTable(
  'user_emails',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_user_emails_email').on(t.email),
    index('idx_user_emails_user_id').on(t.userId),
  ],
)
