import { eq, and, sql, inArray } from 'drizzle-orm'
import {
  users,
  teams,
  achievementPoints,
  pointCategories,
  redemptions,
  rewards,
  pointSummaries,
} from '~/db/schema'
import { db as defaultDb } from '~/db'
import { readSheet } from './google-sheets'
import { createJob, updateJob } from '../repositories/sheet-sync'
import {
  KITTA_SHEET_MAP,
  EMPLOYEE_HEADERS,
  BINTANG_HEADERS,
  PENALTI_HEADERS,
  POIN_AHA_HEADERS,
  REDEEM_HEADERS,
} from '~/shared/constants/sheet-mapping'
import type { DbClient } from '../repositories/base'
import { getDb } from '../repositories/base'

type SyncResult = {
  processed: number
  failed: number
  errors: Array<{ tab: string; row: number; name: string; error: string }>
}

// ── Helpers ──────────────────────────────────────────────────────────

const BATCH_SIZE = 100

async function batchInsert<T extends Record<string, unknown>>(
  db: ReturnType<typeof getDb>,
  table: Parameters<ReturnType<typeof getDb>['insert']>[0],
  rows: T[],
) {
  if (rows.length === 0) return
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await (db.insert(table) as any).values(rows.slice(i, i + BATCH_SIZE)).onConflictDoNothing()
  }
}

async function getOrCreateInactiveTeam(
  branchId: string,
  db: ReturnType<typeof getDb>,
): Promise<string> {
  const [existing] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.branchId, branchId), eq(teams.name, 'Inactive')))
    .limit(1)

  if (existing) return existing.id

  const [created] = await db
    .insert(teams)
    .values({ branchId, name: 'Inactive' })
    .returning({ id: teams.id })

  return created.id
}

type TabNames = {
  employees: string
  bintang: string
  penalti: string
  poinAha: string
  redeem: string
}

export function buildHeaderIndex(
  headers: string[],
  headerMap: Record<string, string>,
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [key, label] of Object.entries(headerMap)) {
    const idx = headers.indexOf(label)
    if (idx !== -1) result[key] = idx
  }
  return result
}

export function parseTimestamp(value: string): Date {
  // 1. Try M/D/YYYY H:MM:SS format (Google Form timestamps)
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/)
  if (match) {
    const [, month, day, year, hour, minute, second] = match
    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ),
    )
  }

  // 2. Try Google Sheets serial number (e.g. 45386.08680 = date + fractional day)
  //    UNFORMATTED_VALUE returns dates as serial numbers (days since Dec 30, 1899)
  const num = Number(value)
  if (!isNaN(num) && num > 25000 && num < 100000) {
    // Google Sheets epoch: Dec 30, 1899
    const SHEETS_EPOCH = Date.UTC(1899, 11, 30) // Dec 30, 1899
    const MS_PER_DAY = 86_400_000
    return new Date(SHEETS_EPOCH + num * MS_PER_DAY)
  }

  // 3. Fallback: let JS Date parse it
  const fallback = new Date(value)
  if (!isNaN(fallback.getTime())) return fallback
  throw new Error(`Cannot parse timestamp: "${value}"`)
}

export function parseReward(value: string): { name: string; cost: number } {
  const match = value.match(/^(.+?)\s*\((\d+)\)$/)
  if (!match) throw new Error(`Cannot parse reward: "${value}"`)
  return { name: match[1].trim(), cost: Number(match[2]) }
}

// ── Pre-load user cache for name-based lookups ──────────────────────

type UserCache = {
  byEmail: Map<string, { id: string }>
  byName: Map<string, { id: string }>
  byAttendanceName: Map<string, { id: string }>
}

async function preloadUserCache(
  branchId: string,
  db: ReturnType<typeof getDb>,
): Promise<UserCache> {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      attendanceName: users.attendanceName,
    })
    .from(users)
    .where(eq(users.branchId, branchId))

  const byEmail = new Map<string, { id: string }>()
  const byName = new Map<string, { id: string }>()
  const byAttendanceName = new Map<string, { id: string }>()

  for (const u of allUsers) {
    byEmail.set(u.email.toLowerCase(), { id: u.id })
    byName.set(u.name.toLowerCase(), { id: u.id })
    if (u.attendanceName) {
      byAttendanceName.set(u.attendanceName.toLowerCase(), { id: u.id })
    }
  }

  return { byEmail, byName, byAttendanceName }
}

async function findOrCreateUsersBatch(
  names: string[],
  branchId: string,
  userCache: UserCache,
  db: ReturnType<typeof getDb>,
): Promise<void> {
  const missing = [...new Set(names.map((n) => n.toLowerCase()))].filter(
    (n) => !userCache.byName.has(n),
  )
  if (missing.length === 0) return

  const inactiveTeamId = await getOrCreateInactiveTeam(branchId, db)

  const newUsers = missing.map((name) => ({
    name,
    email: `former-${name.replace(/\s+/g, '.')}@placeholder.local`,
    branchId,
    teamId: inactiveTeamId,
    department: 'Inactive',
    role: 'employee' as const,
    isActive: false,
    mustChangePassword: true,
  }))

  // Insert in batches, skip conflicts
  for (let i = 0; i < newUsers.length; i += BATCH_SIZE) {
    await db
      .insert(users)
      .values(newUsers.slice(i, i + BATCH_SIZE))
      .onConflictDoNothing()
  }

  // Refresh cache for newly created users
  const created = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.branchId, branchId), inArray(sql`LOWER(${users.name})`, missing)))

  for (const u of created) {
    userCache.byEmail.set(u.email.toLowerCase(), { id: u.id })
    userCache.byName.set(u.name.toLowerCase(), { id: u.id })
  }
}

// ── syncEmployees ───────────────────────────────────────────────────

export async function syncEmployees(
  sheetId: string,
  tabName: string,
  branchId: string,
  tx?: DbClient,
): Promise<SyncResult> {
  const db = getDb(tx)
  const rows = await readSheet(sheetId, tabName)
  if (rows.length < 2) return { processed: 0, failed: 0, errors: [] }

  const headerIndex = buildHeaderIndex(rows[0], EMPLOYEE_HEADERS)
  const dataRows = rows.slice(1)

  let processed = 0
  let failed = 0
  const errors: SyncResult['errors'] = []

  // 1. Pre-load all existing users by email (single query)
  const userCache = await preloadUserCache(branchId, db)

  // 2. Pre-load all existing teams by name (single query)
  const existingTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.branchId, branchId))
  const teamByName = new Map(existingTeams.map((t) => [t.name, t.id]))

  // 3. Collect team names and leader mappings from data
  const teamNames = new Set<string>()
  const leaderMap = new Map<string, string>() // attendanceName -> teamName

  // Parse all rows first, collect what we need
  type ParsedEmployee = {
    rowIdx: number
    name: string
    email: string
    attendanceName?: string
    phone?: string
    teamName?: string
    position?: string
    employmentStatus?: string
    talentaId?: string
  }
  const parsed: ParsedEmployee[] = []

  for (const [i, row] of dataRows.entries()) {
    const name = row[headerIndex.NAME]?.trim()
    const email = row[headerIndex.EMAIL]?.trim().toLowerCase()
    const attendanceName = row[headerIndex.ATTENDANCE_NAME]?.trim()
    const phone = row[headerIndex.PHONE]?.trim()
    const teamName = row[headerIndex.TEAM]?.trim()
    const position = row[headerIndex.POSITION]?.trim()
    const employmentStatus = row[headerIndex.STATUS]?.trim()
    const leaderAttendanceName = row[headerIndex.LEADER]?.trim()
    const talentaId = row[headerIndex.TALENTA_ID]?.trim()

    if (!name || !email) {
      failed++
      errors.push({ tab: tabName, row: i + 2, name: name ?? '', error: 'Missing name or email' })
      continue
    }

    if (teamName) teamNames.add(teamName)
    if (leaderAttendanceName && teamName) leaderMap.set(leaderAttendanceName, teamName)

    parsed.push({
      rowIdx: i,
      name,
      email,
      attendanceName,
      phone,
      teamName,
      position,
      employmentStatus,
      talentaId,
    })
  }

  // 4. Create missing teams in batch
  const missingTeams = [...teamNames].filter((n) => !teamByName.has(n))
  if (missingTeams.length > 0) {
    const created = await db
      .insert(teams)
      .values(missingTeams.map((name) => ({ branchId, name })))
      .onConflictDoNothing()
      .returning({ id: teams.id, name: teams.name })
    for (const t of created) teamByName.set(t.name, t.id)

    // If onConflictDoNothing skipped some, re-fetch
    if (created.length < missingTeams.length) {
      const refetch = await db
        .select({ id: teams.id, name: teams.name })
        .from(teams)
        .where(and(eq(teams.branchId, branchId), inArray(teams.name, missingTeams)))
      for (const t of refetch) teamByName.set(t.name, t.id)
    }
  }

  // 5. Upsert employees — use cache to avoid SELECT per row
  for (const emp of parsed) {
    try {
      const existing = userCache.byEmail.get(emp.email)

      if (existing) {
        await db
          .update(users)
          .set({
            name: emp.name,
            ...(emp.attendanceName && { attendanceName: emp.attendanceName }),
            ...(emp.phone && { phone: emp.phone }),
            ...(emp.employmentStatus && { employmentStatus: emp.employmentStatus }),
            ...(emp.talentaId && { talentaId: emp.talentaId }),
            ...(emp.position && { position: emp.position }),
            ...(emp.teamName ? { teamId: teamByName.get(emp.teamName) ?? null } : {}),
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing.id))
      } else {
        const teamId = emp.teamName ? (teamByName.get(emp.teamName) ?? null) : null
        const [created] = await db
          .insert(users)
          .values({
            name: emp.name,
            email: emp.email,
            attendanceName: emp.attendanceName || null,
            phone: emp.phone || null,
            employmentStatus: emp.employmentStatus || null,
            talentaId: emp.talentaId || null,
            position: emp.position || null,
            teamId,
            branchId,
            role: 'employee',
            isActive: true,
            mustChangePassword: true,
          })
          .returning({ id: users.id })

        // Update cache
        userCache.byEmail.set(emp.email, { id: created.id })
        userCache.byName.set(emp.name.toLowerCase(), { id: created.id })
        if (emp.attendanceName) {
          userCache.byAttendanceName.set(emp.attendanceName.toLowerCase(), { id: created.id })
        }
      }

      processed++
    } catch (err) {
      failed++
      errors.push({
        tab: tabName,
        row: emp.rowIdx + 2,
        name: emp.name,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // 6. Resolve leaders — use pre-loaded cache instead of per-leader queries
  // Refresh cache to include newly created users
  const freshCache = await preloadUserCache(branchId, db)

  for (const [leaderAttendanceName, teamName] of leaderMap.entries()) {
    const teamId = teamByName.get(teamName)
    if (!teamId) continue
    const leader = freshCache.byAttendanceName.get(leaderAttendanceName.toLowerCase())
    if (!leader) continue
    await db
      .update(teams)
      .set({ leaderId: leader.id, updatedAt: new Date() })
      .where(eq(teams.id, teamId))
  }

  return { processed, failed, errors }
}

// ── syncPoints ──────────────────────────────────────────────────────

export async function syncPoints(
  sheetId: string,
  tabName: string,
  categoryCode: string,
  branchId: string,
  tx?: DbClient,
): Promise<SyncResult> {
  const db = getDb(tx)
  const rows = await readSheet(sheetId, tabName)
  if (rows.length < 2) return { processed: 0, failed: 0, errors: [] }

  const [cat] = await db
    .select({ id: pointCategories.id })
    .from(pointCategories)
    .where(eq(pointCategories.code, categoryCode))
    .limit(1)

  if (!cat) {
    return {
      processed: 0,
      failed: 0,
      errors: [{ tab: tabName, row: 0, name: '', error: `Category not found: ${categoryCode}` }],
    }
  }

  const headerMapByCode: Record<string, Record<string, string>> = {
    BINTANG: BINTANG_HEADERS,
    PENALTI: PENALTI_HEADERS,
    POIN_AHA: POIN_AHA_HEADERS,
  }

  const headerMap = headerMapByCode[categoryCode] ?? BINTANG_HEADERS
  const headerIndex = buildHeaderIndex(rows[0], headerMap)
  const dataRows = rows.slice(1)

  let processed = 0
  let failed = 0
  const errors: SyncResult['errors'] = []

  // 1. Pre-load user cache (single query)
  const userCache = await preloadUserCache(branchId, db)

  // 2. Find system admin user for submittedBy fallback (single query)
  const [adminUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.branchId, branchId), eq(users.role, 'admin')))
    .limit(1)

  // 3. Parse all rows first, collect names that need user creation
  type ParsedPoint = {
    rowIdx: number
    name: string
    reason: string
    screenshotUrl: string | null
    points: number
    kittaComponent: string | null
    createdAt: Date
  }
  const parsedRows: ParsedPoint[] = []
  const allNames: string[] = []

  for (const [i, row] of dataRows.entries()) {
    const timestampRaw = row[headerIndex.TIMESTAMP]?.trim()
    const nameRaw = row[headerIndex.NAME]?.trim()
    const reasonRaw = row[headerIndex.REASON]?.trim()
    const screenshotRaw = row[headerIndex.SCREENSHOT]?.trim()

    if (!timestampRaw || !nameRaw) {
      failed++
      errors.push({
        tab: tabName,
        row: i + 2,
        name: nameRaw ?? '',
        error: 'Missing timestamp or name',
      })
      continue
    }

    let createdAt: Date
    try {
      createdAt = parseTimestamp(timestampRaw)
    } catch (err) {
      failed++
      errors.push({
        tab: tabName,
        row: i + 2,
        name: nameRaw,
        error: err instanceof Error ? err.message : String(err),
      })
      continue
    }

    let points = 1
    let kittaComponent: string | null = null

    if (categoryCode === 'PENALTI') {
      const pointsRaw = row[headerIndex.POINTS]?.trim()
      const kittaRaw = row[headerIndex.KITTA]?.trim()
      points = pointsRaw ? Number(pointsRaw) : 1
      if (isNaN(points) || points <= 0) points = 1
      kittaComponent = kittaRaw ? (KITTA_SHEET_MAP[kittaRaw] ?? null) : null
    } else if (categoryCode === 'POIN_AHA') {
      const pointsRaw = row[headerIndex.POINTS]?.trim()
      points = pointsRaw ? Number(pointsRaw) : 1
      if (isNaN(points) || points <= 0) points = 1
    }

    allNames.push(nameRaw)
    parsedRows.push({
      rowIdx: i,
      name: nameRaw,
      reason: reasonRaw ?? '',
      screenshotUrl: screenshotRaw || null,
      points,
      kittaComponent,
      createdAt,
    })
  }

  // 4. Batch-create missing users (instead of findOrCreateUser per row)
  try {
    await findOrCreateUsersBatch(allNames, branchId, userCache, db)
  } catch (err) {
    // Non-fatal — individual rows will fail below
  }

  // 5. Pre-load existing points for dedup (single query)
  const existingPoints = await db
    .select({
      userId: achievementPoints.userId,
      reason: achievementPoints.reason,
      createdSecond: sql<string>`to_char(${achievementPoints.createdAt}, 'YYYY-MM-DD HH24:MI:SS')`,
    })
    .from(achievementPoints)
    .where(and(eq(achievementPoints.branchId, branchId), eq(achievementPoints.categoryId, cat.id)))

  const dedupSet = new Set(existingPoints.map((p) => `${p.userId}|${p.reason}|${p.createdSecond}`))

  // 6. Insert new points in batches
  const toInsert: Array<{
    branchId: string
    userId: string
    categoryId: string
    points: number
    reason: string
    screenshotUrl: string | null
    kittaComponent: 'K' | 'I' | 'T1' | 'T2' | 'A' | null
    status: 'active'
    submittedBy: string
    createdAt: Date
    updatedAt: Date
  }> = []

  for (const row of parsedRows) {
    const user = userCache.byName.get(row.name.toLowerCase())
    if (!user) {
      failed++
      errors.push({
        tab: tabName,
        row: row.rowIdx + 2,
        name: row.name,
        error: `Could not find or create user: ${row.name}`,
      })
      continue
    }

    const createdSecond = `${row.createdAt.getUTCFullYear()}-${String(row.createdAt.getUTCMonth() + 1).padStart(2, '0')}-${String(row.createdAt.getUTCDate()).padStart(2, '0')} ${String(row.createdAt.getUTCHours()).padStart(2, '0')}:${String(row.createdAt.getUTCMinutes()).padStart(2, '0')}:${String(row.createdAt.getUTCSeconds()).padStart(2, '0')}`
    const dedupKey = `${user.id}|${row.reason}|${createdSecond}`

    if (dedupSet.has(dedupKey)) {
      processed++
      continue
    }

    const submittedBy = categoryCode === 'BINTANG' ? user.id : (adminUser?.id ?? user.id)

    toInsert.push({
      branchId,
      userId: user.id,
      categoryId: cat.id,
      points: row.points,
      reason: row.reason,
      screenshotUrl: row.screenshotUrl,
      kittaComponent: row.kittaComponent as 'K' | 'I' | 'T1' | 'T2' | 'A' | null,
      status: 'active',
      submittedBy,
      createdAt: row.createdAt,
      updatedAt: new Date(),
    })

    dedupSet.add(dedupKey) // prevent dupes within same batch
    processed++
  }

  // Batch insert
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    try {
      await db.insert(achievementPoints).values(toInsert.slice(i, i + BATCH_SIZE))
    } catch (err) {
      // If batch fails, fall back to individual inserts for this chunk
      for (const row of toInsert.slice(i, i + BATCH_SIZE)) {
        try {
          await db.insert(achievementPoints).values(row)
        } catch (innerErr) {
          processed--
          failed++
          errors.push({
            tab: tabName,
            row: 0,
            name: '',
            error: innerErr instanceof Error ? innerErr.message : String(innerErr),
          })
        }
      }
    }
  }

  return { processed, failed, errors }
}

// ── syncRedemptions ─────────────────────────────────────────────────

export async function syncRedemptions(
  sheetId: string,
  tabName: string,
  branchId: string,
  tx?: DbClient,
): Promise<SyncResult> {
  const db = getDb(tx)
  const rows = await readSheet(sheetId, tabName)
  if (rows.length < 2) return { processed: 0, failed: 0, errors: [] }

  const headerIndex = buildHeaderIndex(rows[0], REDEEM_HEADERS)
  const dataRows = rows.slice(1)

  let processed = 0
  let failed = 0
  const errors: SyncResult['errors'] = []

  // 1. Pre-load user cache (single query)
  const userCache = await preloadUserCache(branchId, db)

  // 2. Pre-load all rewards (single query)
  const existingRewards = await db
    .select({ id: rewards.id, name: rewards.name, pointCost: rewards.pointCost })
    .from(rewards)
  const rewardMap = new Map(existingRewards.map((r) => [`${r.name}|${r.pointCost}`, r.id]))

  // 3. Pre-load existing redemptions for dedup (single query)
  const existingRedemptionRows = await db
    .select({
      userId: redemptions.userId,
      rewardId: redemptions.rewardId,
      createdSecond: sql<string>`to_char(${redemptions.createdAt}, 'YYYY-MM-DD HH24:MI:SS')`,
    })
    .from(redemptions)
    .where(eq(redemptions.branchId, branchId))

  const redemptionDedupSet = new Set(
    existingRedemptionRows.map((r) => `${r.userId}|${r.rewardId}|${r.createdSecond}`),
  )

  // 4. Parse rows, collect missing user names
  type ParsedRedemption = {
    rowIdx: number
    name: string
    email?: string
    createdAt: Date
    reward: { name: string; cost: number }
    notes: string | null
  }
  const parsedRows: ParsedRedemption[] = []
  const allNames: string[] = []

  for (const [i, row] of dataRows.entries()) {
    const timestampRaw = row[headerIndex.TIMESTAMP]?.trim()
    const nameRaw = row[headerIndex.NAME]?.trim()
    const rewardRaw = row[headerIndex.REWARD]?.trim()
    const emailRaw = row[headerIndex.EMAIL]?.trim().toLowerCase()
    const notesRaw = row[headerIndex.NOTES]?.trim()

    if (!timestampRaw || !nameRaw || !rewardRaw) {
      failed++
      errors.push({
        tab: tabName,
        row: i + 2,
        name: nameRaw ?? '',
        error: 'Missing required fields',
      })
      continue
    }

    let createdAt: Date
    try {
      createdAt = parseTimestamp(timestampRaw)
    } catch (err) {
      failed++
      errors.push({
        tab: tabName,
        row: i + 2,
        name: nameRaw,
        error: err instanceof Error ? err.message : String(err),
      })
      continue
    }

    let parsedReward: { name: string; cost: number }
    try {
      parsedReward = parseReward(rewardRaw)
    } catch (err) {
      failed++
      errors.push({
        tab: tabName,
        row: i + 2,
        name: nameRaw,
        error: err instanceof Error ? err.message : String(err),
      })
      continue
    }

    allNames.push(nameRaw)
    parsedRows.push({
      rowIdx: i,
      name: nameRaw,
      email: emailRaw || undefined,
      createdAt,
      reward: parsedReward,
      notes: notesRaw || null,
    })
  }

  // 5. Batch-create missing users
  try {
    await findOrCreateUsersBatch(allNames, branchId, userCache, db)
  } catch (err) {
    // Non-fatal
  }

  // 6. Collect and batch-create missing rewards
  const missingRewardKeys = new Set<string>()
  for (const row of parsedRows) {
    const key = `${row.reward.name}|${row.reward.cost}`
    if (!rewardMap.has(key)) missingRewardKeys.add(key)
  }

  if (missingRewardKeys.size > 0) {
    const newRewards = [...missingRewardKeys].map((key) => {
      const [name, cost] = key.split('|')
      return { name, pointCost: Number(cost), branchId, isActive: true }
    })

    const created = await db
      .insert(rewards)
      .values(newRewards)
      .onConflictDoNothing()
      .returning({ id: rewards.id, name: rewards.name, pointCost: rewards.pointCost })

    for (const r of created) {
      rewardMap.set(`${r.name}|${r.pointCost}`, r.id)
    }

    // Re-fetch if some were skipped by onConflictDoNothing
    if (created.length < newRewards.length) {
      const refetch = await db
        .select({ id: rewards.id, name: rewards.name, pointCost: rewards.pointCost })
        .from(rewards)
      for (const r of refetch) {
        rewardMap.set(`${r.name}|${r.pointCost}`, r.id)
      }
    }
  }

  // 7. Build insert batch
  const toInsert: Array<{
    branchId: string
    userId: string
    rewardId: string
    pointsSpent: number
    notes: string | null
    status: 'approved'
    createdAt: Date
    updatedAt: Date
  }> = []

  for (const row of parsedRows) {
    // Resolve user: try email first, then name
    let user: { id: string } | undefined
    if (row.email) {
      user = userCache.byEmail.get(row.email)
    }
    if (!user) {
      user = userCache.byName.get(row.name.toLowerCase())
    }

    if (!user) {
      failed++
      errors.push({
        tab: tabName,
        row: row.rowIdx + 2,
        name: row.name,
        error: `Could not find or create user: ${row.name}`,
      })
      continue
    }

    const rewardKey = `${row.reward.name}|${row.reward.cost}`
    const rewardId = rewardMap.get(rewardKey)
    if (!rewardId) {
      failed++
      errors.push({
        tab: tabName,
        row: row.rowIdx + 2,
        name: row.name,
        error: `Reward not found: ${row.reward.name}`,
      })
      continue
    }

    const createdSecond = `${row.createdAt.getUTCFullYear()}-${String(row.createdAt.getUTCMonth() + 1).padStart(2, '0')}-${String(row.createdAt.getUTCDate()).padStart(2, '0')} ${String(row.createdAt.getUTCHours()).padStart(2, '0')}:${String(row.createdAt.getUTCMinutes()).padStart(2, '0')}:${String(row.createdAt.getUTCSeconds()).padStart(2, '0')}`
    const dedupKey = `${user.id}|${rewardId}|${createdSecond}`

    if (redemptionDedupSet.has(dedupKey)) {
      processed++
      continue
    }

    toInsert.push({
      branchId,
      userId: user.id,
      rewardId,
      pointsSpent: row.reward.cost,
      notes: row.notes,
      status: 'approved',
      createdAt: row.createdAt,
      updatedAt: new Date(),
    })

    redemptionDedupSet.add(dedupKey)
    processed++
  }

  // Batch insert
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    try {
      await db.insert(redemptions).values(toInsert.slice(i, i + BATCH_SIZE))
    } catch (err) {
      for (const row of toInsert.slice(i, i + BATCH_SIZE)) {
        try {
          await db.insert(redemptions).values(row)
        } catch (innerErr) {
          processed--
          failed++
          errors.push({
            tab: tabName,
            row: 0,
            name: '',
            error: innerErr instanceof Error ? innerErr.message : String(innerErr),
          })
        }
      }
    }
  }

  return { processed, failed, errors }
}

// ── recalculatePointSummaries ───────────────────────────────────────

export async function recalculatePointSummaries(branchId: string, tx?: DbClient): Promise<void> {
  const db = getDb(tx)

  // Single SQL: compute all summaries and upsert in one shot
  await db.execute(sql`
    INSERT INTO point_summaries (id, user_id, branch_id, bintang_count, penalti_points_sum, direct_poin_aha, redeemed_total, updated_at)
    SELECT
      gen_random_uuid(),
      u.id,
      u.branch_id,
      COALESCE(SUM(CASE WHEN pc.code = 'BINTANG' AND ap.status = 'active' THEN 1 ELSE 0 END), 0)::int,
      COALESCE(SUM(CASE WHEN pc.code = 'PENALTI' AND ap.status = 'active' THEN ap.points ELSE 0 END), 0)::int,
      COALESCE(SUM(CASE WHEN pc.code = 'POIN_AHA' AND ap.status = 'active' THEN ap.points ELSE 0 END), 0)::int,
      COALESCE(rd.redeemed, 0)::int,
      NOW()
    FROM users u
    LEFT JOIN achievement_points ap ON ap.user_id = u.id
    LEFT JOIN point_categories pc ON pc.id = ap.category_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(r.points_spent), 0)::int AS redeemed
      FROM redemptions r
      WHERE r.user_id = u.id AND r.status = 'approved'
    ) rd ON TRUE
    WHERE u.branch_id = ${branchId}
    GROUP BY u.id, u.branch_id, rd.redeemed
    ON CONFLICT (user_id) DO UPDATE SET
      bintang_count = EXCLUDED.bintang_count,
      penalti_points_sum = EXCLUDED.penalti_points_sum,
      direct_poin_aha = EXCLUDED.direct_poin_aha,
      redeemed_total = EXCLUDED.redeemed_total,
      updated_at = NOW()
  `)
}

// ── runFullSync ─────────────────────────────────────────────────────

export async function runFullSync(
  sheetIds: { points: string; employees: string },
  tabNames: TabNames,
  branchId: string,
  startedBy?: string,
  tx?: DbClient,
  direction: 'import' | 'resync' = 'import',
) {
  const db = (tx ?? defaultDb) as unknown as DbClient

  const job = await createJob(
    {
      branchId,
      direction,
      sheetId: `${sheetIds.employees},${sheetIds.points}`,
      sheetName: Object.values(tabNames).join(', '),
      status: 'in_progress',
      startedBy: startedBy ?? null,
      startedAt: new Date(),
      rowsProcessed: 0,
      rowsFailed: 0,
    },
    db,
  )

  let totalProcessed = 0
  let totalFailed = 0
  const allErrors: SyncResult['errors'] = []

  const runStep = async (fn: () => Promise<SyncResult>) => {
    try {
      const result = await fn()
      totalProcessed += result.processed
      totalFailed += result.failed
      allErrors.push(...result.errors)
    } catch (err) {
      totalFailed++
      allErrors.push({
        tab: 'unknown',
        row: 0,
        name: '',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  await runStep(() => syncEmployees(sheetIds.employees, tabNames.employees, branchId, db))
  await runStep(() => syncPoints(sheetIds.points, tabNames.bintang, 'BINTANG', branchId, db))
  await runStep(() => syncPoints(sheetIds.points, tabNames.penalti, 'PENALTI', branchId, db))
  await runStep(() => syncPoints(sheetIds.points, tabNames.poinAha, 'POIN_AHA', branchId, db))
  await runStep(() => syncRedemptions(sheetIds.points, tabNames.redeem, branchId, db))

  try {
    await recalculatePointSummaries(branchId, db)
  } catch (err) {
    allErrors.push({
      tab: 'point_summaries',
      row: 0,
      name: '',
      error: err instanceof Error ? err.message : String(err),
    })
  }

  await updateJob(
    job.id,
    {
      status: totalFailed > 0 && totalProcessed === 0 ? 'failed' : 'completed',
      rowsProcessed: totalProcessed,
      rowsFailed: totalFailed,
      errorLog: allErrors.length > 0 ? allErrors : null,
      completedAt: new Date(),
    },
    db,
  )

  return {
    jobId: job.id,
    processed: totalProcessed,
    failed: totalFailed,
    errors: allErrors,
  }
}

/**
 * Wipe all transactional data for the branch, then re-import from the sheet.
 * Use this to fix data issues or for initial setup.
 * Once the app generates its own data, use runFullSync instead (incremental dedup).
 */
export async function runFullResync(
  sheetIds: { points: string; employees: string },
  tabNames: TabNames,
  branchId: string,
  startedBy?: string,
) {
  const db = defaultDb as unknown as DbClient

  // Wipe then re-import without a wrapping transaction — a single
  // transaction would time out on large datasets (14k+ rows).
  await db.delete(redemptions).where(eq(redemptions.branchId, branchId))
  await db.delete(achievementPoints).where(eq(achievementPoints.branchId, branchId))
  await db.delete(pointSummaries).where(eq(pointSummaries.branchId, branchId))

  return runFullSync(sheetIds, tabNames, branchId, startedBy, undefined, 'resync')
}
