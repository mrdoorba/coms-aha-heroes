import type { PageLoad } from './$types'

// Profile data comes from userState (already hydrated from the auth layout).
// No API call needed — just return an empty object so the page loads.
export const load: PageLoad = async () => {
  return {}
}
