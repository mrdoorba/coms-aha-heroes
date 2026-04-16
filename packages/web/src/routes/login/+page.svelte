<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { signIn } from '$lib/auth/client'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'

  let email = $state('')
  let password = $state('')
  let error = $state<string | null>(null)
  let loading = $state(false)

  const redirectTo = $derived($page.url.searchParams.get('redirect') ?? '/dashboard')

  async function handleEmailLogin(e: SubmitEvent) {
    e.preventDefault()
    error = null
    loading = true

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: redirectTo,
      })

      if (result?.error) {
        error = result.error.message ?? 'Invalid email or password.'
      } else {
        goto(redirectTo)
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Login failed. Please try again.'
    } finally {
      loading = false
    }
  }

  async function handleGoogleLogin() {
    error = null
    loading = true

    try {
      await signIn.social({
        provider: 'google',
        callbackURL: redirectTo,
      })
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Google login failed.'
      loading = false
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
  <div class="w-full max-w-md">
    <!-- Branding -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">AHA HEROES</h1>
      <p class="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
    </div>

    <Card.Root class="shadow-lg">
      <Card.Header class="pb-4">
        <Card.Title class="text-xl">Welcome back</Card.Title>
        <Card.Description>Enter your credentials to continue</Card.Description>
      </Card.Header>

      <Card.Content class="space-y-4">
        <!-- Error alert -->
        {#if error}
          <div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        {/if}

        <!-- Google OAuth -->
        <Button
          variant="outline"
          class="w-full"
          onclick={handleGoogleLogin}
          disabled={loading}
        >
          <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t"></span>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <!-- Email/password form -->
        <form onsubmit={handleEmailLogin} class="space-y-4">
          <div class="space-y-1.5">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              bind:value={email}
              required
              autocomplete="email"
              disabled={loading}
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <Label for="password">Password</Label>
              <a
                href="/forgot-password"
                class="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              bind:value={password}
              required
              autocomplete="current-password"
              disabled={loading}
            />
          </div>

          <Button type="submit" class="w-full" disabled={loading}>
            {#if loading}
              <svg
                class="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Signing in…
            {:else}
              Sign in
            {/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
