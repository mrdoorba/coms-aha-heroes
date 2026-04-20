import { redirect } from '@sveltejs/kit'
import { buildPortalSignInUrl } from '$lib/server/portal-broker'
import type { PageServerLoad } from './$types'

function safeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const redirectTo = safeRedirect(url.searchParams.get('redirect'))
  if (locals.user) redirect(302, redirectTo)

  // Send unauthenticated users to the portal root. After they sign in there
  // and click the heroes app card, portal mints a one-time code and redirects
  // to /auth/portal/exchange?portal_code=... Deep-link preservation across the
  // portal login bounce isn't supported by the portal today.
  redirect(302, buildPortalSignInUrl())
}
