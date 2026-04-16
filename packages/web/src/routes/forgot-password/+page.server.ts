import { superValidate, message } from 'sveltekit-superforms'
import { typebox } from 'sveltekit-superforms/adapters'
import { Type as t } from 'typebox'
import { auth } from '@coms/server/auth'
import type { Actions, PageServerLoad } from './$types'

const forgotPasswordSchema = t.Object({
  email: t.String({ format: 'email', minLength: 1 }),
})

export const load: PageServerLoad = async () => {
  const form = await superValidate(typebox(forgotPasswordSchema))
  return { form }
}

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, typebox(forgotPasswordSchema))

    if (!form.valid) {
      return { form }
    }

    // Always return success to prevent email enumeration.
    // Fire-and-forget the actual reset request.
    try {
      await auth.api.requestPasswordReset({
        body: {
          email: form.data.email,
          redirectTo: '/change-password',
        },
      })
    } catch {
      // Swallow errors to prevent email enumeration
    }

    return message(form, 'sent')
  },
}
