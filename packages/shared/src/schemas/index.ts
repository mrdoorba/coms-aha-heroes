// packages/shared/src/schemas/index.ts
// !! AUTO-GENERATED — do not edit by hand !!
// Run `bun run generate:schemas` in packages/shared to regenerate.

// --- Hand-written domain schemas (ported from src/shared/schemas) ---
export { uuidSchema, paginationSchema, type PaginationInput } from './common'
export { loginSchema, changePasswordSchema, type LoginInput, type ChangePasswordInput } from './auth'
export {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ListUsersInput,
} from './users'
export {
  createTeamSchema,
  updateTeamSchema,
  listTeamsSchema,
  type CreateTeamInput,
  type UpdateTeamInput,
  type ListTeamsInput,
} from './teams'
export {
  submitPointSchema,
  listPointsSchema,
  approveRejectSchema,
  type SubmitPointInput,
  type ListPointsInput,
  type ApproveRejectInput,
} from './points'
export {
  fileChallengeSchema,
  resolveChallengeSchema,
  listChallengesSchema,
  type FileChallengeInput,
  type ResolveChallengeInput,
  type ListChallengesInput,
} from './challenges'
export {
  fileAppealSchema,
  resolveAppealSchema,
  listAppealsSchema,
  type FileAppealInput,
  type ResolveAppealInput,
  type ListAppealsInput,
} from './appeals'
export {
  createCommentSchema,
  updateCommentSchema,
  listCommentsSchema,
  type CreateCommentInput,
  type UpdateCommentInput,
  type ListCommentsInput,
} from './comments'
export {
  bulkUserActionSchema,
  bulkPointActionSchema,
  bulkRedemptionActionSchema,
  type BulkUserActionInput,
  type BulkPointActionInput,
  type BulkRedemptionActionInput,
  type BulkResult,
  type BulkResultItem,
} from './bulk'
export {
  listAuditLogsSchema,
  type ListAuditLogsInput,
} from './audit'
export {
  requestRedemptionSchema,
  listRedemptionsSchema,
  resolveRedemptionSchema,
  type RequestRedemptionInput,
  type ListRedemptionsInput,
  type ResolveRedemptionInput,
} from './redemptions'
export {
  reportsQuerySchema,
  type ReportsQueryInput,
} from './reports'
export {
  listRewardsSchema,
  createRewardSchema,
  updateRewardSchema,
  type ListRewardsInput,
  type CreateRewardInput,
  type UpdateRewardInput,
} from './rewards'
export {
  listSettingsSchema,
  updateSettingSchema,
  type ListSettingsInput,
  type UpdateSettingInput,
} from './settings'
export {
  syncJobSchema,
  syncStatusSchema,
  type SyncJob,
  type SyncStatus,
} from './sheet-sync'
// --- End hand-written schemas ---

import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import type { Static } from '@sinclair/typebox'
import { Type, type TObject } from '@sinclair/typebox'
import {
  user,
  session,
  account,
  verification,
} from '../db/schema'
import {
  branches,
  teams,
  users,
  userEmails,
  systemSettings,
  pointCategories,
  pointCategoryTranslations,
  achievementPoints,
  challenges,
  appeals,
  comments,
  rewards,
  redemptions,
  notifications,
  pointSummaries,
  auditLogs,
  sheetSyncJobs,
} from '../db/schema'

// --- user ---
export const userSelectSchema: TObject = createSelectSchema(user) as TObject
export type UserSelect = Static<typeof userSelectSchema>
export const userInsertSchema: TObject = createInsertSchema(user) as TObject
export type UserInsert = Static<typeof userInsertSchema>

// --- session ---
export const sessionSelectSchema: TObject = createSelectSchema(session) as TObject
export type SessionSelect = Static<typeof sessionSelectSchema>
export const sessionInsertSchema: TObject = createInsertSchema(session) as TObject
export type SessionInsert = Static<typeof sessionInsertSchema>

// --- account ---
export const accountSelectSchema: TObject = createSelectSchema(account) as TObject
export type AccountSelect = Static<typeof accountSelectSchema>
export const accountInsertSchema: TObject = createInsertSchema(account) as TObject
export type AccountInsert = Static<typeof accountInsertSchema>

// --- verification ---
export const verificationSelectSchema: TObject = createSelectSchema(verification) as TObject
export type VerificationSelect = Static<typeof verificationSelectSchema>
export const verificationInsertSchema: TObject = createInsertSchema(verification) as TObject
export type VerificationInsert = Static<typeof verificationInsertSchema>

// --- branches ---
export const branchesSelectSchema: TObject = createSelectSchema(branches) as TObject
export type BranchesSelect = Static<typeof branchesSelectSchema>
export const branchesInsertSchema: TObject = createInsertSchema(branches) as TObject
export type BranchesInsert = Static<typeof branchesInsertSchema>

// --- teams ---
export const teamsSelectSchema: TObject = createSelectSchema(teams) as TObject
export type TeamsSelect = Static<typeof teamsSelectSchema>
export const teamsInsertSchema: TObject = createInsertSchema(teams) as TObject
export type TeamsInsert = Static<typeof teamsInsertSchema>

// --- users ---
export const usersSelectSchema: TObject = createSelectSchema(users) as TObject
export type UsersSelect = Static<typeof usersSelectSchema>
export const usersInsertSchema: TObject = createInsertSchema(users) as TObject
export type UsersInsert = Static<typeof usersInsertSchema>

// --- userEmails ---
export const userEmailsSelectSchema: TObject = createSelectSchema(userEmails) as TObject
export type UserEmailsSelect = Static<typeof userEmailsSelectSchema>
export const userEmailsInsertSchema: TObject = createInsertSchema(userEmails) as TObject
export type UserEmailsInsert = Static<typeof userEmailsInsertSchema>

// --- systemSettings ---
export const systemSettingsSelectSchema: TObject = createSelectSchema(systemSettings) as TObject
export type SystemSettingsSelect = Static<typeof systemSettingsSelectSchema>
export const systemSettingsInsertSchema: TObject = createInsertSchema(systemSettings) as TObject
export type SystemSettingsInsert = Static<typeof systemSettingsInsertSchema>

// --- pointCategories ---
export const pointCategoriesSelectSchema: TObject = createSelectSchema(pointCategories) as TObject
export type PointCategoriesSelect = Static<typeof pointCategoriesSelectSchema>
export const pointCategoriesInsertSchema: TObject = createInsertSchema(pointCategories) as TObject
export type PointCategoriesInsert = Static<typeof pointCategoriesInsertSchema>

// --- pointCategoryTranslations ---
export const pointCategoryTranslationsSelectSchema: TObject = createSelectSchema(pointCategoryTranslations) as TObject
export type PointCategoryTranslationsSelect = Static<typeof pointCategoryTranslationsSelectSchema>
export const pointCategoryTranslationsInsertSchema: TObject = createInsertSchema(pointCategoryTranslations) as TObject
export type PointCategoryTranslationsInsert = Static<typeof pointCategoryTranslationsInsertSchema>

// --- achievementPoints ---
export const achievementPointsSelectSchema: TObject = createSelectSchema(achievementPoints) as TObject
export type AchievementPointsSelect = Static<typeof achievementPointsSelectSchema>
export const achievementPointsInsertSchema: TObject = createInsertSchema(achievementPoints) as TObject
export type AchievementPointsInsert = Static<typeof achievementPointsInsertSchema>

// --- challenges ---
export const challengesSelectSchema: TObject = createSelectSchema(challenges) as TObject
export type ChallengesSelect = Static<typeof challengesSelectSchema>
export const challengesInsertSchema: TObject = createInsertSchema(challenges) as TObject
export type ChallengesInsert = Static<typeof challengesInsertSchema>

// --- appeals ---
export const appealsSelectSchema: TObject = createSelectSchema(appeals) as TObject
export type AppealsSelect = Static<typeof appealsSelectSchema>
export const appealsInsertSchema: TObject = createInsertSchema(appeals) as TObject
export type AppealsInsert = Static<typeof appealsInsertSchema>

// --- comments ---
export const commentsSelectSchema: TObject = createSelectSchema(comments) as TObject
export type CommentsSelect = Static<typeof commentsSelectSchema>
export const commentsInsertSchema: TObject = createInsertSchema(comments) as TObject
export type CommentsInsert = Static<typeof commentsInsertSchema>

// --- rewards ---
export const rewardsSelectSchema: TObject = createSelectSchema(rewards) as TObject
export type RewardsSelect = Static<typeof rewardsSelectSchema>
export const rewardsInsertSchema: TObject = createInsertSchema(rewards) as TObject
export type RewardsInsert = Static<typeof rewardsInsertSchema>

// --- redemptions ---
export const redemptionsSelectSchema: TObject = createSelectSchema(redemptions) as TObject
export type RedemptionsSelect = Static<typeof redemptionsSelectSchema>
export const redemptionsInsertSchema: TObject = createInsertSchema(redemptions) as TObject
export type RedemptionsInsert = Static<typeof redemptionsInsertSchema>

// --- notifications ---
export const notificationsSelectSchema: TObject = createSelectSchema(notifications) as TObject
export type NotificationsSelect = Static<typeof notificationsSelectSchema>
export const notificationsInsertSchema: TObject = createInsertSchema(notifications) as TObject
export type NotificationsInsert = Static<typeof notificationsInsertSchema>

// --- pointSummaries ---
export const pointSummariesSelectSchema: TObject = createSelectSchema(pointSummaries) as TObject
export type PointSummariesSelect = Static<typeof pointSummariesSelectSchema>
export const pointSummariesInsertSchema: TObject = createInsertSchema(pointSummaries) as TObject
export type PointSummariesInsert = Static<typeof pointSummariesInsertSchema>

// --- auditLogs ---
export const auditLogsSelectSchema: TObject = createSelectSchema(auditLogs) as TObject
export type AuditLogsSelect = Static<typeof auditLogsSelectSchema>
export const auditLogsInsertSchema: TObject = createInsertSchema(auditLogs) as TObject
export type AuditLogsInsert = Static<typeof auditLogsInsertSchema>

// --- sheetSyncJobs ---
export const sheetSyncJobsSelectSchema: TObject = createSelectSchema(sheetSyncJobs) as TObject
export type SheetSyncJobsSelect = Static<typeof sheetSyncJobsSelectSchema>
export const sheetSyncJobsInsertSchema: TObject = createInsertSchema(sheetSyncJobs) as TObject
export type SheetSyncJobsInsert = Static<typeof sheetSyncJobsInsertSchema>

// --- safeUser (users select schema without sensitive fields) ---
export const safeUserSchema: TObject = Type.Omit(usersSelectSchema, ['mustChangePassword']) as unknown as TObject
export type SafeUser = Static<typeof safeUserSchema>

export { Type }
