<script lang="ts">
  import { goto } from '$app/navigation'
  import { authClient } from '$lib/auth/client'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'

  let currentPassword = $state('')
  let newPassword = $state('')
  let confirmPassword = $state('')
  let error = $state<string | null>(null)
  let loading = $state(false)

  const passwordMismatch = $derived(
    confirmPassword.length > 0 && newPassword !== confirmPassword,
  )

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    error = null

    if (newPassword !== confirmPassword) {
      error = 'New passwords do not match.'
      return
    }

    if (newPassword.length < 8) {
      error = 'New password must be at least 8 characters.'
      return
    }

    loading = true

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      })

      if (result?.error) {
        error = result.error.message ?? 'Failed to change password.'
      } else {
        goto('/dashboard')
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to change password. Please try again.'
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
      <p class="mt-1 text-sm text-muted-foreground">Change your password</p>
    </div>

    <Card.Root class="shadow-lg">
      <Card.Header class="pb-4">
        <Card.Title class="text-xl">Set a new password</Card.Title>
        <Card.Description>
          Enter your current password and choose a new one.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <form onsubmit={handleSubmit} class="space-y-4">
          {#if error}
            <div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          {/if}

          <div class="space-y-1.5">
            <Label for="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              placeholder="••••••••"
              bind:value={currentPassword}
              required
              autocomplete="current-password"
              disabled={loading}
            />
          </div>

          <div class="space-y-1.5">
            <Label for="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              bind:value={newPassword}
              required
              autocomplete="new-password"
              disabled={loading}
            />
            <p class="text-xs text-muted-foreground">Minimum 8 characters</p>
          </div>

          <div class="space-y-1.5">
            <Label for="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              bind:value={confirmPassword}
              required
              autocomplete="new-password"
              disabled={loading}
              class={passwordMismatch ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {#if passwordMismatch}
              <p class="text-xs text-destructive">Passwords do not match</p>
            {/if}
          </div>

          <Button
            type="submit"
            class="w-full"
            disabled={loading || passwordMismatch}
          >
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
              Updating…
            {:else}
              Update password
            {/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
