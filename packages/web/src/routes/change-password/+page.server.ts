import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

// Password flows are owned by the portal. Bounce through /login, which in turn
// sends the user to the portal root.
export const load: PageServerLoad = async () => redirect(302, '/login')
