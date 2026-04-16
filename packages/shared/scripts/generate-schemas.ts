/**
 * Schema generation script for @coms/shared
 * Generates TypeBox schemas from Drizzle table definitions using drizzle-typebox.
 *
 * Run with: bun run scripts/generate-schemas.ts
 * (or: bun run generate:schemas)
 */

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ---------------------------------------------------------------------------
// Tables to generate schemas for
// Table export name → camelCase variable name used in the output file
// ---------------------------------------------------------------------------

const AUTH_TABLES = [
  { varName: 'user',         schemaPrefix: 'user' },
  { varName: 'session',      schemaPrefix: 'session' },
  { varName: 'account',      schemaPrefix: 'account' },
  { varName: 'verification', schemaPrefix: 'verification' },
] as const

const APP_TABLES = [
  { varName: 'branches',                  schemaPrefix: 'branches' },
  { varName: 'teams',                     schemaPrefix: 'teams' },
  { varName: 'users',                     schemaPrefix: 'users' },
  { varName: 'userEmails',                schemaPrefix: 'userEmails' },
  { varName: 'systemSettings',            schemaPrefix: 'systemSettings' },
  { varName: 'pointCategories',           schemaPrefix: 'pointCategories' },
  { varName: 'pointCategoryTranslations', schemaPrefix: 'pointCategoryTranslations' },
  { varName: 'achievementPoints',         schemaPrefix: 'achievementPoints' },
  { varName: 'challenges',                schemaPrefix: 'challenges' },
  { varName: 'appeals',                   schemaPrefix: 'appeals' },
  { varName: 'comments',                  schemaPrefix: 'comments' },
  { varName: 'rewards',                   schemaPrefix: 'rewards' },
  { varName: 'redemptions',               schemaPrefix: 'redemptions' },
  { varName: 'notifications',             schemaPrefix: 'notifications' },
  { varName: 'pointSummaries',            schemaPrefix: 'pointSummaries' },
  { varName: 'auditLogs',                 schemaPrefix: 'auditLogs' },
  { varName: 'sheetSyncJobs',             schemaPrefix: 'sheetSyncJobs' },
] as const

const ALL_TABLES = [...AUTH_TABLES, ...APP_TABLES]

// ---------------------------------------------------------------------------
// Build the generated file as a string
// ---------------------------------------------------------------------------

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const authVarNames = AUTH_TABLES.map((t) => t.varName).join(',\n  ')
const appVarNames  = APP_TABLES.map((t) => t.varName).join(',\n  ')

const lines: string[] = [
  '// packages/shared/src/schemas/index.ts',
  '// !! AUTO-GENERATED — do not edit by hand !!',
  '// Run `bun run generate:schemas` in packages/shared to regenerate.',
  '',
  "import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'",
  "import type { Static } from '@sinclair/typebox'",
  "import { Type, type TObject } from '@sinclair/typebox'",
  "import {",
  `  ${authVarNames},`,
  "} from '../db/schema'",
  "import {",
  `  ${appVarNames},`,
  "} from '../db/schema'",
  '',
]

// Generate select + insert schemas for every table
for (const { varName, schemaPrefix } of ALL_TABLES) {
  const pascal = capitalise(schemaPrefix)
  const selectName = `${schemaPrefix}SelectSchema`
  const insertName = `${schemaPrefix}InsertSchema`
  lines.push(`// --- ${varName} ---`)
  lines.push(`export const ${selectName}: TObject = createSelectSchema(${varName}) as TObject`)
  lines.push(`export type ${pascal}Select = Static<typeof ${selectName}>`)
  lines.push(`export const ${insertName}: TObject = createInsertSchema(${varName}) as TObject`)
  lines.push(`export type ${pascal}Insert = Static<typeof ${insertName}>`)
  lines.push('')
}

// safeUserSchema — users select schema minus the mustChangePassword field
lines.push('// --- safeUser (users select schema without sensitive fields) ---')
lines.push("export const safeUserSchema: TObject = Type.Omit(usersSelectSchema, ['mustChangePassword']) as unknown as TObject")
lines.push('export type SafeUser = Static<typeof safeUserSchema>')
lines.push('')
lines.push('export { Type }')
lines.push('')

const output = lines.join('\n')

const outPath = resolve(__dirname, '../src/schemas/index.ts')
writeFileSync(outPath, output, 'utf-8')

const total = ALL_TABLES.length * 2 + 1 // select + insert per table, plus safeUserSchema
console.log(`✓ Generated ${total} schemas → ${outPath}`)
console.log(`  Tables: ${ALL_TABLES.map((t) => t.varName).join(', ')}`)
console.log(`  Extra:  safeUserSchema`)
