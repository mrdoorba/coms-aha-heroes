<script lang="ts">
  import { authClient } from '$lib/auth/client'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'

  let email = $state('')
  let submitted = $state(false)
  let loading = $state(false)
  let error = $state<string | null>(null)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    error = null
    loading = true

    try {
      await authClient.forgetPassword({
        email,
        redirectTo: '/change-password',
      })
      submitted = true
    } catch (err: unknown) {
      // Always show the generic message to avoid email enumeration
      submitted = true
    } finally {
      loading = false
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
  <div class="w-full max-w-md">
    <!-- Branding -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">AHA HEROES</h1>
      <p class="mt-1 text-sm text-muted-foreground">Password reset</p>
    </div>

    <Card.Root class="shadow-lg">
      <Card.Header class="pb-4">
        <Card.Title class="text-xl">Forgot your password?</Card.Title>
        <Card.Description>
          Enter your email address and we'll send a reset link if the account exists.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        {#if submitted}
          <div class="space-y-4">
            <div class="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              If that email exists, a reset link has been sent. Check your inbox.
            </div>
            <Button variant="outline" class="w-full" href="/login">
              Back to login
            </Button>
          </div>
        {:else}
          <form onsubmit={handleSubmit} class="space-y-4">
            {#if error}
              <div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            {/if}

            <div class="space-y-1.5">
              <Label for="email">Email address</Label>
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
                Sending…
              {:else}
                Send reset link
              {/if}
            </Button>

            <div class="text-center">
              <a
                href="/login"
                class="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Back to login
              </a>
            </div>
          </form>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
