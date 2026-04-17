import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    redirect(302, `/login?redirect=${encodeURIComponent(url.pathname)}`)
  }

  if (locals.user.mustChangePassword && url.pathname !== '/change-password') {
    redirect(302, '/change-password')
  }

  const actor = locals.user

  const { withRLS } = await import('@coms/server/repositories/base')
  const usersRepo = await import('@coms/server/repositories/users')
  const notificationsRepo = await import('@coms/server/repositories/notifications')

  const [avatarUrl, unreadCount] = await withRLS(actor, (db) =>
    Promise.all([
      usersRepo.getUserById(actor.id, db).then((u) => u?.avatarUrl ?? null),
      notificationsRepo.countUnread(actor.id, db),
    ]),
  )

  return {
    user: actor,
    avatarUrl,
    unreadCount,
  }
}
