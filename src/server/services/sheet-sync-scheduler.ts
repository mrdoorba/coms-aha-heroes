import { db } from '~/db'
import { branches } from '~/db/schema'
import { runFullSync } from './sheet-sync'

type SyncConfig = {
  sheetIds: {
    points: string
    employees: string
  }
  tabNames: {
    employees: string
    bintang: string
    penalti: string
    poinAha: string
    redeem: string
  }
  branchId: string
}

let isSyncing = false

async function getDefaultBranchId(): Promise<string | null> {
  const [branch] = await db.select({ id: branches.id }).from(branches).limit(1)
  return branch?.id ?? null
}

function buildConfigFromEnv(): Omit<SyncConfig, 'branchId'> {
  return {
    sheetIds: {
      points: process.env.GOOGLE_SHEET_ID_POINTS ?? '',
      employees: process.env.GOOGLE_SHEET_ID_EMPLOYEES ?? '',
    },
    tabNames: {
      employees: process.env.SHEET_TAB_EMPLOYEES ?? 'HEROES - Fulltime Staff',
      bintang: process.env.SHEET_TAB_BINTANG ?? 'Poin Bintang',
      penalti: process.env.SHEET_TAB_PENALTI ?? 'Poin Penalti',
      poinAha: process.env.SHEET_TAB_POIN_AHA ?? 'Poin AHA',
      redeem: process.env.SHEET_TAB_REDEEM ?? 'Redeem Poin AHA',
    },
  }
}

export function isSyncRunning(): boolean {
  return isSyncing
}

export async function triggerManualSync(startedBy?: string) {
  if (isSyncing) return null
  isSyncing = true
  try {
    const config = buildConfigFromEnv()
    const branchId = await getDefaultBranchId()
    if (!branchId) throw new Error('No branch found')
    if (!config.sheetIds.points && !config.sheetIds.employees) {
      throw new Error('GOOGLE_SHEET_ID_POINTS/EMPLOYEES env vars not set')
    }
    return await runFullSync(config.sheetIds, config.tabNames, branchId, startedBy)
  } catch (err) {
    console.error('[sheet-sync] sync error:', err)
    throw err
  } finally {
    isSyncing = false
  }
}
