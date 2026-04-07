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

// Cache for the "Inactive" team — created once per sync run
let inactiveTeamId: string | null = null

async function getOrCreateInactiveTeam(
  branchId: string,
  db: ReturnType<typeof getDb>,
): Promise<string> {
  if (inactiveTeamId) return inactiveTeamId

  const [existing] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.branchId, branchId), eq(teams.name, 'Inactive')))
    .limit(1)

  if (existing) {
    inactiveTeamId = existing.id
    return inactiveTeamId
  }

  const [created] = await db
    .insert(teams)
    .values({ branchId, name: 'Inactive' })
    .returning({ id: teams.id })

  inactiveTeamId = created.id
  return inactiveTeamId
}

// Find user by name (case-insensitive). If not found, auto-create as inactive.
async function findOrCreateUser(
  name: string,
  branchId: string,
  db: ReturnType<typeof getDb>,
): Promise<{ id: string }> {
  const [found] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.branchId, branchId), sql`LOWER(${users.name}) = LOWER(${name})`))
    .limit(1)

  if (found) return found

  const teamId = await getOrCreateInactiveTeam(branchId, db)

  const [created] = await db
    .insert(users)
    .values({
      name,
      email: `former-${name.toLowerCase().replace(/\s+/g, '.')}@placeholder.local`,
      branchId,
      teamId,
      department: 'Inactive',
      role: 'employee',
      isActive: false,
      mustChangePassword: true,
    })
    .onConflictDoNothing()
    .returning({ id: users.id })

  if (created) return created

  // If conflict on email (duplicate former employee name), try lookup again
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.branchId, branchId), sql`LOWER(${users.name}) = LOWER(${name})`))
    .limit(1)

  if (existing) return existing
  throw new Error(`Could not create or find user: ${name}`)
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
  // Format: M/D/YYYY H:MM:SS or M/D/YYYY HH:MM:SS
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/)
  if (!match) {
    const fallback = new Date(value)
    if (!isNaN(fallback.getTime())) return fallback
    throw new Error(`Cannot parse timestamp: "${value}"`)
  }
  const [, month, day, year, hour, minute, second] = match
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  )
}

export function parseReward(value: string): { name: string; cost: number } {
  const match = value.match(/^(.+?)\s*\((\d+)\)$/)
  if (!match) throw new Error(`Cannot parse reward: "${value}"`)
  return { name: match[1].trim(), cost: Number(match[2]) }
}

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

  const teamNames = new Set<string>()
  const leaderMap = new Map<string, string>() // attendanceName -> teamName

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

    try {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existing) {
        await db
          .update(users)
          .set({
            name,
            ...(attendanceName && { attendanceName }),
            ...(phone && { phone }),
            ...(employmentStatus && { employmentStatus }),
            ...(talentaId && { talentaId }),
            ...(position && { position }),
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing.id))
      } else {
        await db.insert(users).values({
          name,
          email,
          attendanceName: attendanceName || null,
          phone: phone || null,
          employmentStatus: employmentStatus || null,
          talentaId: talentaId || null,
          position: position || null,
          branchId,
          role: 'employee',
          isActive: true,
          mustChangePassword: true,
        })
      }

      processed++
    } catch (err) {
      failed++
      errors.push({
        tab: tabName,
        row: i + 2,
        name,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Resolve teams: find-or-create
  const teamIdByName = new Map<string, string>()
  for (const teamName of teamNames) {
    const [existing] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.branchId, branchId), eq(teams.name, teamName)))
      .limit(1)

    if (existing) {
      teamIdByName.set(teamName, existing.id)
    } else {
      const [created] = await db
        .insert(teams)
        .values({ branchId, name: teamName })
        .returning({ id: teams.id })
      teamIdByName.set(teamName, created.id)
    }
  }

  // Assign teamId to users
  for (const row of dataRows) {
    const email = row[headerIndex.EMAIL]?.trim().toLowerCase()
    const teamName = row[headerIndex.TEAM]?.trim()
    if (!email || !teamName) continue
    const teamId = teamIdByName.get(teamName)
    if (!teamId) continue
    await db
      .update(users)
      .set({ teamId, updatedAt: new Date() })
      .where(eq(users.email, email))
  }

  // Resolve leaders: find user by attendanceName, set as team leaderId
  for (const [leaderAttendanceName, teamName] of leaderMap.entries()) {
    const teamId = teamIdByName.get(teamName)
    if (!teamId) continue
    const [leader] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.branchId, branchId), eq(users.attendanceName, leaderAttendanceName)))
      .limit(1)
    if (!leader) continue
    await db
      .update(teams)
      .set({ leaderId: leader.id, updatedAt: new Date() })
      .where(eq(teams.id, teamId))
  }

  return { processed, failed, errors }
}

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

  // Find a system admin user for submittedBy fallback
  const [adminUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.branchId, branchId), eq(users.role, 'admin')))
    .limit(1)

  for (const [i, row] of dataRows.entries()) {
    const timestampRaw = row[headerIndex.TIMESTAMP]?.trim()
    const nameRaw = row[headerIndex.NAME]?.trim()
    const reasonRaw = row[headerIndex.REASON]?.trim()
    const screenshotRaw = row[headerIndex.SCREENSHOT]?.trim()

    if (!timestampRaw || !nameRaw) {
      failed++
      errors.push({ tab: tabName, row: i + 2, name: nameRaw ?? '', error: 'Missing timestamp or name' })
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

    // Match user by name (case-insensitive), auto-create inactive if not found
    let matchedUser: { id: string }
    try {
      matchedUser = await findOrCreateUser(nameRaw, branchId, db)
    } catch (err) {
      failed++
      errors.push({ tab: tabName, row: i + 2, name: nameRaw, error: err instanceof Error ? err.message : String(err) })
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

    const reason = reasonRaw ?? ''

    // Dedup check: same userId + categoryId + createdAt + reason
    const [existing] = await db
      .select({ id: achievementPoints.id })
      .from(achievementPoints)
      .where(
        and(
          eq(achievementPoints.userId, matchedUser.id),
          eq(achievementPoints.categoryId, cat.id),
          eq(achievementPoints.reason, reason),
          sql`date_trunc('minute', ${achievementPoints.createdAt}) = date_trunc('minute', ${createdAt.toISOString()}::timestamptz)`,
        ),
      )
      .limit(1)

    if (existing) {
      processed++
      continue
    }

    try {
      const submittedBy =
        categoryCode === 'BINTANG' ? matchedUser.id : (adminUser?.id ?? matchedUser.id)

      await db.insert(achievementPoints).values({
        branchId,
        userId: matchedUser.id,
        categoryId: cat.id,
        points,
        reason,
        screenshotUrl: screenshotRaw || null,
        kittaComponent: kittaComponent as 'K' | 'I' | 'T1' | 'T2' | 'A' | null,
        status: 'active',
        submittedBy,
        createdAt,
        updatedAt: new Date(),
      })

      processed++
    } catch (err) {
      failed++
      errors.push({
        tab: tabName,
        row: i + 2,
        name: nameRaw,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { processed, failed, errors }
}

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

  for (const [i, row] of dataRows.entries()) {
    const timestampRaw = row[headerIndex.TIMESTAMP]?.trim()
    const nameRaw = row[headerIndex.NAME]?.trim()
    const rewardRaw = row[headerIndex.REWARD]?.trim()
    const emailRaw = row[headerIndex.EMAIL]?.trim().toLowerCase()
    const notesRaw = row[headerIndex.NOTES]?.trim()

    if (!timestampRaw || !nameRaw || !rewardRaw) {
      failed++
      errors.push({ tab: tabName, row: i + 2, name: nameRaw ?? '', error: 'Missing required fields' })
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

    // Match user by email first, then name (case-insensitive), auto-create inactive if not found
    let matchedUser: { id: string } | undefined

    if (emailRaw) {
      const [byEmail] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, emailRaw))
        .limit(1)
      matchedUser = byEmail
    }

    if (!matchedUser) {
      try {
        matchedUser = await findOrCreateUser(nameRaw, branchId, db)
      } catch (err) {
        failed++
        errors.push({ tab: tabName, row: i + 2, name: nameRaw, error: err instanceof Error ? err.message : String(err) })
        continue
      }
    }

    // Find-or-create reward
    let rewardId: string
    const [existingReward] = await db
      .select({ id: rewards.id })
      .from(rewards)
      .where(
        and(
          eq(rewards.name, parsedReward.name),
          eq(rewards.pointCost, parsedReward.cost),
        ),
      )
      .limit(1)

    if (existingReward) {
      rewardId = existingReward.id
    } else {
      const [created] = await db
        .insert(rewards)
        .values({
          name: parsedReward.name,
          pointCost: parsedReward.cost,
          branchId,
          isActive: true,
        })
        .returning({ id: rewards.id })
      rewardId = created.id
    }

    // Dedup check
    const [existingRedemption] = await db
      .select({ id: redemptions.id })
      .from(redemptions)
      .where(
        and(
          eq(redemptions.userId, matchedUser.id),
          eq(redemptions.rewardId, rewardId),
          sql`date_trunc('minute', ${redemptions.createdAt}) = date_trunc('minute', ${createdAt.toISOString()}::timestamptz)`,
        ),
      )
      .limit(1)

    if (existingRedemption) {
      processed++
      continue
    }

    try {
      await db.insert(redemptions).values({
        branchId,
        userId: matchedUser.id,
        rewardId,
        pointsSpent: parsedReward.cost,
        notes: notesRaw || null,
        status: 'approved',
        createdAt,
        updatedAt: new Date(),
      })

      processed++
    } catch (err) {
      failed++
      errors.push({
        tab: tabName,
        row: i + 2,
        name: nameRaw,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { processed, failed, errors }
}

export async function recalculatePointSummaries(
  branchId: string,
  tx?: DbClient,
): Promise<void> {
  const db = getDb(tx)

  // Get all categories
  const cats = await db
    .select({ id: pointCategories.id, code: pointCategories.code })
    .from(pointCategories)

  const bintangCat = cats.find((c) => c.code === 'BINTANG')
  const penaltiCat = cats.find((c) => c.code === 'PENALTI')
  const poinAhaCat = cats.find((c) => c.code === 'POIN_AHA')

  // Get all users in branch
  const branchUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.branchId, branchId))

  if (branchUsers.length === 0) return

  const userIds = branchUsers.map((u) => u.id)

  // Aggregate achievement points per user
  const pointAggRows = await db
    .select({
      userId: achievementPoints.userId,
      categoryId: achievementPoints.categoryId,
      total: sql<number>`COALESCE(SUM(${achievementPoints.points}), 0)::int`,
      cnt: sql<number>`COUNT(*)::int`,
    })
    .from(achievementPoints)
    .where(
      and(
        eq(achievementPoints.branchId, branchId),
        eq(achievementPoints.status, 'active'),
        inArray(achievementPoints.userId, userIds),
      ),
    )
    .groupBy(achievementPoints.userId, achievementPoints.categoryId)

  // Aggregate redemptions per user
  const redemptionAggRows = await db
    .select({
      userId: redemptions.userId,
      total: sql<number>`COALESCE(SUM(${redemptions.pointsSpent}), 0)::int`,
    })
    .from(redemptions)
    .where(
      and(
        eq(redemptions.branchId, branchId),
        eq(redemptions.status, 'approved'),
        inArray(redemptions.userId, userIds),
      ),
    )
    .groupBy(redemptions.userId)

  const redemptionByUser = new Map(redemptionAggRows.map((r) => [r.userId, r.total]))

  // Build per-user summaries
  const bintangByUser = new Map<string, number>()
  const penaltiByUser = new Map<string, number>()
  const poinAhaByUser = new Map<string, number>()

  for (const row of pointAggRows) {
    if (bintangCat && row.categoryId === bintangCat.id) {
      bintangByUser.set(row.userId, (bintangByUser.get(row.userId) ?? 0) + row.cnt)
    } else if (penaltiCat && row.categoryId === penaltiCat.id) {
      penaltiByUser.set(row.userId, (penaltiByUser.get(row.userId) ?? 0) + row.total)
    } else if (poinAhaCat && row.categoryId === poinAhaCat.id) {
      poinAhaByUser.set(row.userId, (poinAhaByUser.get(row.userId) ?? 0) + row.total)
    }
  }

  // Upsert point summaries
  for (const { id: userId } of branchUsers) {
    await db
      .insert(pointSummaries)
      .values({
        userId,
        branchId,
        bintangCount: bintangByUser.get(userId) ?? 0,
        penaltiPointsSum: penaltiByUser.get(userId) ?? 0,
        directPoinAha: poinAhaByUser.get(userId) ?? 0,
        redeemedTotal: redemptionByUser.get(userId) ?? 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pointSummaries.userId,
        set: {
          bintangCount: bintangByUser.get(userId) ?? 0,
          penaltiPointsSum: penaltiByUser.get(userId) ?? 0,
          directPoinAha: poinAhaByUser.get(userId) ?? 0,
          redeemedTotal: redemptionByUser.get(userId) ?? 0,
          updatedAt: new Date(),
        },
      })
  }
}

export async function runFullSync(
  sheetIds: { points: string; employees: string },
  tabNames: TabNames,
  branchId: string,
  startedBy?: string,
  tx?: DbClient,
) {
  inactiveTeamId = null // reset cache for each sync run
  const db = (tx ?? defaultDb) as unknown as DbClient

  const job = await createJob(
    {
      branchId,
      direction: 'import',
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
