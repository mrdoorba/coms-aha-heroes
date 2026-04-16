import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) {
    const raw = url.searchParams.get('redirect')
    const redirectTo = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard'
    redirect(302, redirectTo)
  }
}
