import { createAuthClient } from 'better-auth/svelte'
import { adminClient } from 'better-auth/client/plugins'

const authBaseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [adminClient()],
})

export const { signIn, signUp, signOut } = authClient
