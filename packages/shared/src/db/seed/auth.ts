import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { db } from '../index'
import * as schema from '../schema'

// Standalone auth instance for seeding (uses relative imports for tsx compat)
const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  basePath: '/api/auth',
  emailAndPassword: { enabled: true },
  plugins: [admin()],
})

const DEV_PASSWORD = 'changeme123'

const devAccounts = [
  { email: 'admin@aha.com', name: 'System Admin' },
  { email: 'hr.sari@aha.com', name: 'Sari Dewi' },
  { email: 'hr.somchai@aha.com', name: 'Somchai Prasert' },
  { email: 'leader.budi@aha.com', name: 'Budi Santoso' },
  { email: 'emp.doni@aha.com', name: 'Doni Prasetya' },
]

export async function seedAuth() {
  console.log('Seeding Better Auth accounts...')

  for (const account of devAccounts) {
    try {
      await auth.api.signUpEmail({
        body: {
          email: account.email,
          password: DEV_PASSWORD,
          name: account.name,
        },
      })
      console.log(`  Created auth account: ${account.email}`)
    } catch (err) {
      // Account may already exist from previous seed run
      console.log(`  Skipped ${account.email}: ${err instanceof Error ? err.message : 'already exists'}`)
    }
  }
}
