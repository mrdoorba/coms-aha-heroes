import { redirect } from '@sveltejs/kit'
import { buildPortalSignInUrl } from '$lib/server/portal-broker'
import type { PageServerLoad } from './$types'

// Password flows are owned by the portal. The `(authed)` layout redirects
// users with mustChangePassword here; we bounce them to the portal so the
// portal-side password change flow can run and clear the flag via auth-sync.
export const load: PageServerLoad = async () => redirect(302, buildPortalSignInUrl())
