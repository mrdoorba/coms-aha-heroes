import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    redirect(302, `/login?redirect=${encodeURIComponent(url.pathname)}`)
  }

  if (locals.user.mustChangePassword && url.pathname !== '/change-password') {
    redirect(302, '/change-password')
  }

  return {
    user: locals.user,
  }
}
