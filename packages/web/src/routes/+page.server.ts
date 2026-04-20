import { redirect } from '@sveltejs/kit'
import { buildPortalSignInUrl } from '$lib/server/portal-broker'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  redirect(302, locals.user ? '/dashboard' : buildPortalSignInUrl())
}
