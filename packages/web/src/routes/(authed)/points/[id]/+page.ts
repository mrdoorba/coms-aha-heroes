import type { PageLoad } from './$types'
import { api, unwrap } from '$lib/api/client'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ fetch, params }) => {
  const result = await api.api.v1.points({ id: params.id }).get({ fetch })

  if (result.error) {
    const status = (result.error as any)?.status ?? 500
    const message = (result.error as any)?.value?.error?.message ?? 'Point not found'
    error(status === 404 ? 404 : 500, message)
  }

  return {
    point: unwrap(result, 'Failed to load point'),
  }
}
