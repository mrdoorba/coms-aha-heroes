import { superValidate, message } from 'sveltekit-superforms'
import { typebox } from 'sveltekit-superforms/adapters'
import { Type as t } from 'typebox'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const changePasswordSchema = t.Object({
  currentPassword: t.String({ minLength: 1 }),
  newPassword: t.String({ minLength: 8 }),
  confirmPassword: t.String({ minLength: 1 }),
})

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session) {
    redirect(302, '/login')
  }

  const form = await superValidate(typebox(changePasswordSchema))
  return { form }
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, typebox(changePasswordSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    const { currentPassword, newPassword, confirmPassword } = form.data

    if (newPassword !== confirmPassword) {
      return message(form, 'New passwords do not match.', { status: 400 })
    }

    if (!locals.session) {
      return message(form, 'You must be logged in to change your password.', {
        status: 401,
      })
    }

    try {
      const { auth } = await import('@coms/server/auth')
      const result = await auth.api.changePassword({
        headers: request.headers,
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        },
      })

      if (!result?.user) {
        return message(form, 'Failed to change password.', { status: 400 })
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to change password.'
      return message(form, msg, { status: 500 })
    }

    redirect(302, '/dashboard')
  },
}
