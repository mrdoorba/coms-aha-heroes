import { db } from '../index'
import { authUser } from '../schema'

const devAccounts = [
  { id: 'seed-admin', email: 'admin@aha.com', name: 'System Admin' },
  { id: 'seed-hr-sari', email: 'hr.sari@aha.com', name: 'Sari Dewi' },
  { id: 'seed-hr-somchai', email: 'hr.somchai@aha.com', name: 'Somchai Prasert' },
  { id: 'seed-leader-budi', email: 'leader.budi@aha.com', name: 'Budi Santoso' },
  { id: 'seed-emp-doni', email: 'emp.doni@aha.com', name: 'Doni Prasetya' },
]

// Auth identity is brokered by the COMS portal. Seeding only inserts the
// minimal authUser row so local development sessions can be minted; no
// password is stored. Real users are provisioned via the portal admin UI.
export async function seedAuth() {
  console.log('Seeding portal-shaped auth user rows...')
  for (const account of devAccounts) {
    try {
      await db.insert(authUser).values({
        id: account.id,
        email: account.email,
        name: account.name,
        emailVerified: true,
      }).onConflictDoNothing()
      console.log(`  Ensured auth row: ${account.email}`)
    } catch (err) {
      console.log(`  Skipped ${account.email}: ${err instanceof Error ? err.message : 'error'}`)
    }
  }
}
