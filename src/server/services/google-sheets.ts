import { readFile } from 'fs/promises'
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

let authClient: Awaited<ReturnType<typeof google.auth.getClient>> | null = null

async function getAuthClient() {
  if (authClient) return authClient

  const saKeyEnv = process.env.GOOGLE_SHEETS_SA_KEY
  if (!saKeyEnv) {
    throw new GoogleSheetsConfigError('GOOGLE_SHEETS_SA_KEY is not set')
  }

  let keyJson: string

  // Detect base64-encoded JSON (does not start with '{' or '/')
  if (!saKeyEnv.trimStart().startsWith('{') && !saKeyEnv.startsWith('/')) {
    const decoded = Buffer.from(saKeyEnv.trim(), 'base64').toString('utf-8')
    keyJson = decoded
  } else if (saKeyEnv.startsWith('/')) {
    // File path
    keyJson = await readFile(saKeyEnv.trim(), 'utf-8')
  } else {
    // Inline JSON
    keyJson = saKeyEnv.trim()
  }

  const credentials = JSON.parse(keyJson)

  authClient = await google.auth.getClient({
    credentials,
    scopes: SCOPES,
  })

  return authClient
}

/**
 * Reads all rows from a tab in a Google Sheet.
 * Returns an array of rows; each row is an array of cell values.
 * The first row is the header row.
 */
export async function readSheet(
  sheetId: string,
  tabName: string,
  range = 'A:ZZ',
): Promise<string[][]> {
  const auth = await getAuthClient()
  const sheets = google.sheets({ version: 'v4', auth })

  const fullRange = `${tabName}!${range}`

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: fullRange,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })

  return (response.data.values ?? []).map((row) =>
    (row as unknown[]).map((cell) => (cell == null ? '' : String(cell))),
  )
}

/**
 * Returns just the header row (first row) of a tab.
 */
export async function getSheetHeaders(sheetId: string, tabName: string): Promise<string[]> {
  const rows = await readSheet(sheetId, tabName, 'A1:ZZ1')
  return rows[0] ?? []
}

// Domain errors
export class GoogleSheetsConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GoogleSheetsConfigError'
  }
}

export class GoogleSheetsReadError extends Error {
  constructor(sheetId: string, tabName: string, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    super(`Failed to read sheet "${sheetId}" tab "${tabName}": ${reason}`)
    this.name = 'GoogleSheetsReadError'
    this.cause = cause
  }
}
