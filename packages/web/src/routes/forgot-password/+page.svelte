<script lang="ts">
  import { superForm } from 'sveltekit-superforms'
  import { ArrowLeft, Mail } from 'lucide-svelte'
  import * as m from '$lib/paraglide/messages'
  import StarField from '$lib/components/login/StarField.svelte'
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte'

  let { data } = $props()

  const { form, errors, enhance, delayed, message } = superForm(data.form)
</script>

<!-- Full-viewport dark navy wrapper (matches login page) -->
<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0e2a]">
  <!-- Canvas starfield background -->
  <StarField />

  <!-- CSS-only decorative layers -->
  <div class="login-stars" aria-hidden="true"></div>
  <div class="login-glow" aria-hidden="true"></div>

  <!-- Glass card -->
  <div
    class="login-fade-in relative z-10 w-full max-w-sm rounded-3xl bg-white/95 p-8 backdrop-blur-sm"
    style="box-shadow: var(--shadow-modal)"
  >
    <!-- AHA HEROES wordmark -->
    <div class="mb-6 text-center">
      <div
        class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
        style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
      >
        <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 5h-1V3H6v2H5a3 3 0 0 0 0 6h.08A6.01 6.01 0 0 0 11 14.93V17H9v2h6v-2h-2v-2.07A6.01 6.01 0 0 0 18.92 11H19a3 3 0 0 0 0-6zM5 9a1 1 0 0 1 0-2h1v2H5zm14 0h-1V7h1a1 1 0 0 1 0 2z" />
        </svg>
      </div>
      <h1 class="font-manrope text-2xl font-extrabold tracking-wide text-[#1a1a1a]">
        AHA HEROES
      </h1>
      <p class="mt-1 text-sm text-gray-500">{m.forgot_password_subtitle()}</p>
    </div>

    {#if $message === 'sent'}
      <!-- Success state -->
      <div class="space-y-4">
        <div class="flex flex-col items-center gap-3 rounded-lg bg-green-50 p-4 text-center ring-1 ring-green-100">
          <Mail class="h-8 w-8 text-green-600" />
          <p class="text-sm font-medium text-green-800">{m.forgot_password_sent_title()}</p>
          <p class="text-xs text-green-600">{m.forgot_password_sent_body()}</p>
        </div>
        <a
          href="/login"
          class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft class="h-4 w-4" />
          {m.forgot_password_back_to_login()}
        </a>
      </div>
    {:else}
      <!-- Request form -->
      <form method="POST" use:enhance class="space-y-5">
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-gray-700">
            {m.login_email()}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            bind:value={$form.email}
            disabled={$delayed}
            autocomplete="email"
            placeholder="your@email.com"
            aria-invalid={$errors.email ? 'true' : undefined}
            class="block w-full rounded-md border border-gray-300 px-4 py-3 text-sm shadow-sm placeholder-gray-400 transition-all focus:border-[#3B68E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B68E5]/20"
          />
          {#if $errors.email}
            <p class="mt-1 text-xs text-red-600">{$errors.email}</p>
          {/if}
        </div>

        <button
          type="submit"
          disabled={$delayed}
          class="btn-gradient-blue w-full rounded-lg px-4 py-3 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B68E5] focus:ring-offset-2 disabled:opacity-50"
        >
          {#if $delayed}
            <span class="flex items-center justify-center gap-2">
              <svg
                class="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {m.forgot_password_sending()}
            </span>
          {:else}
            {m.forgot_password_send_button()}
          {/if}
        </button>

        <div class="text-center">
          <a
            href="/login"
            class="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#3B68E5]"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            {m.forgot_password_back_to_login()}
          </a>
        </div>
      </form>
    {/if}

    <!-- Language selector -->
    <div class="mt-8 flex justify-center">
      <LanguageSwitcher />
    </div>
  </div>
</div>
