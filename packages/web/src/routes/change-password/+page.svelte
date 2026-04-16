<script lang="ts">
  import { superForm } from 'sveltekit-superforms'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  const { form, errors, enhance, delayed, message } = superForm(data.form)

  const passwordMismatch = $derived(
    $form.confirmPassword.length > 0 && $form.newPassword !== $form.confirmPassword,
  )
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
  <div class="w-full max-w-md">
    <!-- Branding -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">{m.app_name()}</h1>
      <p class="mt-1 text-sm text-muted-foreground">{m.change_password_title()}</p>
    </div>

    <Card.Root class="shadow-lg">
      <Card.Header class="pb-4">
        <Card.Title class="text-xl">{m.change_password_title()}</Card.Title>
        <Card.Description>
          {m.change_password_subtitle()}
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <form method="POST" use:enhance class="space-y-4">
          {#if $message}
            <div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {$message}
            </div>
          {/if}

          <div class="space-y-1.5">
            <Label for="current-password">{m.change_password_current()}</Label>
            <Input
              id="current-password"
              name="currentPassword"
              type="password"
              placeholder="••••••••"
              bind:value={$form.currentPassword}
              required
              autocomplete="current-password"
              disabled={$delayed}
              aria-invalid={$errors.currentPassword ? 'true' : undefined}
            />
            {#if $errors.currentPassword}
              <p class="text-xs text-destructive">{$errors.currentPassword}</p>
            {/if}
          </div>

          <div class="space-y-1.5">
            <Label for="new-password">{m.change_password_new()}</Label>
            <Input
              id="new-password"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              bind:value={$form.newPassword}
              required
              autocomplete="new-password"
              disabled={$delayed}
              aria-invalid={$errors.newPassword ? 'true' : undefined}
            />
            {#if $errors.newPassword}
              <p class="text-xs text-destructive">{$errors.newPassword}</p>
            {/if}
          </div>

          <div class="space-y-1.5">
            <Label for="confirm-password">{m.change_password_confirm()}</Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              bind:value={$form.confirmPassword}
              required
              autocomplete="new-password"
              disabled={$delayed}
              class={passwordMismatch ? 'border-destructive focus-visible:ring-destructive' : ''}
              aria-invalid={$errors.confirmPassword ? 'true' : undefined}
            />
            {#if $errors.confirmPassword}
              <p class="text-xs text-destructive">{$errors.confirmPassword}</p>
            {:else if passwordMismatch}
              <p class="text-xs text-destructive">{m.change_password_mismatch()}</p>
            {/if}
          </div>

          <Button
            type="submit"
            class="w-full"
            disabled={$delayed || passwordMismatch}
          >
            {#if $delayed}
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
              {m.change_password_changing()}
            {:else}
              {m.change_password_button()}
            {/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
