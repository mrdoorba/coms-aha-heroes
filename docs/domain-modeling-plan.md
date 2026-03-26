# Implementation Plan — Domain Modeling

> **Spec:** `docs/superpowers/specs/2026-03-26-domain-modeling-design.md`
> **Date:** 2026-03-26

---

## Prerequisites

- pnpm installed
- Node.js 22+
- Project dependencies installed (`pnpm install`)

## Step 0: Project scaffold

Create `src/` directory structure and install domain-layer dependencies.

```bash
mkdir -p src/db/schema src/db/migrations src/db/seed
mkdir -p src/shared/schemas src/shared/types src/shared/constants
mkdir -p src/server/routes src/server/services src/server/repositories src/server/middleware src/server/jobs
mkdir -p src/routes src/components src/lib src/messages
```

Install:
```bash
pnpm add drizzle-orm pg zod hono @hono/node-server
pnpm add -D drizzle-kit @types/pg typescript
```

Create `tsconfig.json` with `@/*` path alias → `./src/*`.

---

## Step 1: Constants (`src/shared/constants/`)

No dependencies — pure TypeScript, write first.

### Files (write in parallel):

1. **`roles.ts`** — `USER_ROLES`, `ROLE_HIERARCHY`, `hasRole()` helper
2. **`point-status.ts`** — `POINT_STATUSES`, `REDEMPTION_STATUSES`, `SHEET_SYNC_STATUSES`, `POINT_STATUS_TRANSITIONS`
3. **`kitta.ts`** — `KITTA_CATEGORIES`, `VIOLATION_LEVELS`
4. **`settings.ts`** — `SETTING_KEYS`, `SETTING_DEFAULTS`
5. **`notifications.ts`** — `NOTIFICATION_TYPES`, `NOTIFICATION_ENTITY_TYPES`
6. **`audit.ts`** — `AUDIT_ACTIONS`
7. **`index.ts`** — barrel re-export

---

## Step 2: Drizzle schema (`src/db/schema/`)

Depends on constants (imports enums). Write in dependency order.

### Files (write in order):

1. **`branches.ts`** — `branches`, `systemSettings` tables
2. **`users.ts`** — `userRoleEnum`, `teams`, `users` tables + relations (imports branches)
3. **`points.ts`** — `pointStatusEnum`, `pointCategories`, `pointCategoryTranslations`, `achievementPoints`, `pointSummaries` + relations (imports users, branches)
4. **`disputes.ts`** — `challenges`, `appeals` + relations (imports points, users)
5. **`rewards.ts`** — `redemptionStatusEnum`, `rewards`, `redemptions` + relations (imports users, branches)
6. **`social.ts`** — `comments`, `notifications` + relations (imports users)
7. **`audit.ts`** — `auditLogs`, `sheetSyncJobs` + relations (imports users)
8. **`index.ts`** — barrel re-export of all tables, enums, relations

### Verification:
```bash
npx tsc --noEmit
```

---

## Step 3: DB client (`src/db/index.ts`)

Drizzle client setup with `node-postgres`. Exports `db` and `withTransaction` helper that wraps `SET LOCAL` for RLS variables.

---

## Step 4: TypeScript types (`src/shared/types/`)

Depends on Drizzle schema (`$inferSelect`, `$inferInsert`).

### Files (write in parallel):

1. **`common.ts`** — `ApiResponse<T>`, `PaginatedResponse<T>`, `PaginationMeta`
2. **`user.ts`** — `User`, `NewUser`, `Team`, `NewTeam`, `Branch`, `SystemSetting`, `UserWithTeam`, `TeamWithLeader`, `TeamWithMembers`
3. **`point.ts`** — `AchievementPoint`, `NewAchievementPoint`, `PointCategory`, `PointCategoryTranslation`, `PointSummary`, `AchievementPointDetail`, `LeaderboardEntry`, `DashboardSummary`, `PointCategoryCode`, `PointStatus`
4. **`dispute.ts`** — `Challenge`, `NewChallenge`, `Appeal`, `NewAppeal`, `DisputeStatus`, `ChallengeDetail`, `AppealDetail`
5. **`reward.ts`** — `Reward`, `NewReward`, `Redemption`, `NewRedemption`, `RedemptionWithReward`
6. **`social.ts`** — `Comment`, `NewComment`, `Notification`, `NewNotification`, `CommentWithAuthor`, `CommentEntityType`, `NotificationEntityType`, `NotificationType`
7. **`audit.ts`** — `AuditLog`, `AuditLogWithActor`, `SheetSyncJob`
8. **`index.ts`** — barrel re-export

---

## Step 5: Zod validation schemas (`src/shared/schemas/`)

Depends on constants (imports enum arrays for `z.enum()`).

### Files (write in parallel):

1. **`common.schema.ts`** — `paginationParams`, `uuidParam`, `signedUrlInput`
2. **`user.schema.ts`** — `createUserInput`, `updateUserInput`, `usersQueryParams`
3. **`team.schema.ts`** — `createTeamInput`, `updateTeamInput`
4. **`point.schema.ts`** — `submitBintangInput`, `submitPenaltiInput`, `submitPoinAhaInput`, `pointsQueryParams`, `approveInput`, `rejectInput`, `revokeInput`
5. **`dispute.schema.ts`** — `fileChallengeInput`, `fileAppealInput`, `resolveDisputeInput`
6. **`reward.schema.ts`** — `createRewardInput`, `updateRewardInput`, `requestRedemptionInput`, `rejectRedemptionInput`, `redemptionsQueryParams`
7. **`social.schema.ts`** — `createCommentInput`, `updateCommentInput`, `commentsQueryParams`, `notificationsQueryParams`
8. **`settings.schema.ts`** — `updateSettingInput`, `createCategoryInput`, `updateCategoryInput`
9. **`leaderboard.schema.ts`** — `leaderboardQueryParams`
10. **`dashboard.schema.ts`** — `dashboardQueryParams`
11. **`admin.schema.ts`** — `auditLogQueryParams`, `updateBranchInput`
12. **`index.ts`** — barrel re-export

---

## Step 6: Drizzle config + initial migration

Create `drizzle.config.ts` at project root. Generate migration from schema:

```bash
npx drizzle-kit generate
```

Create `src/db/seed/index.ts` with:
- 2 branches (Indonesia, Thailand)
- 3 point categories (BINTANG, PENALTI, POIN_AHA)
- 2 system settings (bintang_point_impact=10, penalti_point_impact=5)
- DB triggers (updated_at, point_summary sync, redeemed_total sync) as raw SQL
- RLS policies as raw SQL

---

## Step 7: Architecture doc update

Update `docs/architecture.md`:
- Section 3: Cloud Run description → "TanStack Start + Hono"
- Section 4: diagram → "TanStack Start v1 + Hono", remove RSC reference
- Section 5: replace entire monorepo structure with TanStack Start layout
- Section 7: clarify `beforeLoad` is TanStack Router's hook
- Section 9: "next-intl" → "Paraglide JS" throughout, fix "Adding New Languages" step 3
- Section 12: "next build" → TanStack Start build command
- Root files: remove `next.config.ts` + `tailwind.config.ts`, add `app.config.ts`
- `manifest.json` → `manifest.webmanifest`

---

## Step 8: Verify

```bash
npx tsc --noEmit          # type check passes
npx drizzle-kit generate  # migration generates without errors
```

---

## Execution Strategy

Steps 0-1 are independent — scaffold + constants first.
Steps 2-3 depend on step 1 (schema imports constants).
Steps 4-5 depend on step 2 (types import schema, Zod imports constants).
Step 6 depends on step 2.
Step 7 is independent — can run in parallel with anything.

**Parallelizable groups:**
- Group A: Steps 0 + 1 (scaffold + constants)
- Group B: Steps 2 + 3 (schema + db client) — after Group A
- Group C: Steps 4 + 5 + 7 (types + zod + architecture doc) — after Group B
- Group D: Steps 6 + 8 (migration + verify) — after Group C
