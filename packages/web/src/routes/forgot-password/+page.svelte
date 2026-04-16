<script lang="ts">
  import { superForm } from 'sveltekit-superforms'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  const { form, errors, enhance, delayed, message } = superForm(data.form)
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
  <div class="w-full max-w-md">
    <!-- Branding -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">{m.app_name()}</h1>
      <p class="mt-1 text-sm text-muted-foreground">{m.forgot_password_subtitle()}</p>
    </div>

    <Card.Root class="shadow-lg">
      <Card.Header class="pb-4">
        <Card.Title class="text-xl">{m.login_forgot_password()}</Card.Title>
        <Card.Description>
          {m.forgot_password_subtitle()}
        </Card.Description>
      </Card.Header>

      <Card.Content>
        {#if $message === 'sent'}
          <div class="space-y-4">
            <div class="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              {m.forgot_password_sent_title()}
            </div>
            <p class="text-sm text-muted-foreground">{m.forgot_password_sent_body()}</p>
            <Button variant="outline" class="w-full" href="/login">
              {m.forgot_password_back_to_login()}
            </Button>
          </div>
        {:else}
          <form method="POST" use:enhance class="space-y-4">
            <div class="space-y-1.5">
              <Label for="email">{m.login_email()}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                bind:value={$form.email}
                required
                autocomplete="email"
                disabled={$delayed}
                aria-invalid={$errors.email ? 'true' : undefined}
              />
              {#if $errors.email}
                <p class="text-xs text-destructive">{$errors.email}</p>
              {/if}
            </div>

            <Button type="submit" class="w-full" disabled={$delayed}>
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
                {m.forgot_password_sending()}
              {:else}
                {m.forgot_password_send_button()}
              {/if}
            </Button>

            <div class="text-center">
              <a
                href="/login"
                class="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {m.forgot_password_back_to_login()}
              </a>
            </div>
          </form>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
