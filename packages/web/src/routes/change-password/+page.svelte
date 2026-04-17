<script lang="ts">
  import { superForm } from 'sveltekit-superforms'
  import { Eye, EyeOff } from 'lucide-svelte'
  import * as m from '$lib/paraglide/messages'
  import StarField from '$lib/components/login/StarField.svelte'
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte'

  let { data } = $props()

  const { form, errors, enhance, delayed, message } = superForm(data.form)

  let showCurrent = $state(false)
  let showNew = $state(false)
  let showConfirm = $state(false)

  const passwordMismatch = $derived(
    $form.confirmPassword.length > 0 && $form.newPassword !== $form.confirmPassword,
  )

  // Password strength
  const strength = $derived(getPasswordStrength($form.newPassword))

  function getPasswordStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; color: string } {
    if (!password) return { score: 0, color: 'bg-gray-200' }
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'] as const
    const color = colors[Math.min(score, 4) - 1] ?? colors[0]
    return { score: score as 0 | 1 | 2 | 3 | 4, color }
  }

  function getStrengthLabel(score: number): string {
    if (score <= 1) return m.password_strength_weak()
    if (score === 2) return m.password_strength_fair()
    if (score === 3) return m.password_strength_good()
    return m.password_strength_strong()
  }
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
      <h1 class="font-manrope text-xl font-bold text-[#1a1a1a]">{m.change_password_title()}</h1>
      <p class="mt-1 text-sm text-gray-500">{m.change_password_subtitle()}</p>
    </div>

    <form method="POST" use:enhance class="space-y-4">
      {#if $message}
        <div class="rounded-lg bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-100">
          {$message}
        </div>
      {/if}

      <!-- Current password -->
      <div>
        <label for="current-password" class="mb-1 block text-sm font-medium text-gray-700">
          {m.change_password_current()}
        </label>
        <div class="relative">
          <input
            id="current-password"
            name="currentPassword"
            type={showCurrent ? 'text' : 'password'}
            required
            bind:value={$form.currentPassword}
            disabled={$delayed}
            autocomplete="current-password"
            placeholder="••••••••"
            aria-invalid={$errors.currentPassword ? 'true' : undefined}
            class="block w-full rounded-md border border-gray-300 px-4 py-3 pr-10 text-sm shadow-sm placeholder-gray-400 transition-all focus:border-[#3B68E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B68E5]/20"
          />
          <button
            type="button"
            onclick={() => (showCurrent = !showCurrent)}
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label={showCurrent ? m.login_hide_password() : m.login_show_password()}
          >
            {#if showCurrent}
              <EyeOff class="h-4 w-4" />
            {:else}
              <Eye class="h-4 w-4" />
            {/if}
          </button>
        </div>
        {#if $errors.currentPassword}
          <p class="mt-1 text-xs text-red-600">{$errors.currentPassword}</p>
        {/if}
      </div>

      <!-- New password -->
      <div>
        <label for="new-password" class="mb-1 block text-sm font-medium text-gray-700">
          {m.change_password_new()}
        </label>
        <div class="relative">
          <input
            id="new-password"
            name="newPassword"
            type={showNew ? 'text' : 'password'}
            required
            minlength="8"
            bind:value={$form.newPassword}
            disabled={$delayed}
            autocomplete="new-password"
            placeholder="••••••••"
            aria-invalid={$errors.newPassword ? 'true' : undefined}
            class="block w-full rounded-md border border-gray-300 px-4 py-3 pr-10 text-sm shadow-sm placeholder-gray-400 transition-all focus:border-[#3B68E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B68E5]/20"
          />
          <button
            type="button"
            onclick={() => (showNew = !showNew)}
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label={showNew ? m.login_hide_password() : m.login_show_password()}
          >
            {#if showNew}
              <EyeOff class="h-4 w-4" />
            {:else}
              <Eye class="h-4 w-4" />
            {/if}
          </button>
        </div>
        {#if $errors.newPassword}
          <p class="mt-1 text-xs text-red-600">{$errors.newPassword}</p>
        {/if}
        <!-- Strength indicator -->
        {#if $form.newPassword}
          <div class="mt-2">
            <div class="flex gap-1">
              {#each [1, 2, 3, 4] as i (i)}
                <div
                  class="h-1 flex-1 rounded-full transition-colors {i <= strength.score ? strength.color : 'bg-gray-200'}"
                ></div>
              {/each}
            </div>
            <p class="mt-1 text-xs text-gray-500">{getStrengthLabel(strength.score)}</p>
          </div>
        {/if}
      </div>

      <!-- Confirm password -->
      <div>
        <label for="confirm-password" class="mb-1 block text-sm font-medium text-gray-700">
          {m.change_password_confirm()}
        </label>
        <div class="relative">
          <input
            id="confirm-password"
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            required
            bind:value={$form.confirmPassword}
            disabled={$delayed}
            autocomplete="new-password"
            placeholder="••••••••"
            aria-invalid={$errors.confirmPassword ? 'true' : undefined}
            class="block w-full rounded-md border px-4 py-3 pr-10 text-sm shadow-sm placeholder-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-2 {passwordMismatch
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
              : 'border-gray-300 focus:border-[#3B68E5] focus:ring-[#3B68E5]/20'}"
          />
          <button
            type="button"
            onclick={() => (showConfirm = !showConfirm)}
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label={showConfirm ? m.login_hide_password() : m.login_show_password()}
          >
            {#if showConfirm}
              <EyeOff class="h-4 w-4" />
            {:else}
              <Eye class="h-4 w-4" />
            {/if}
          </button>
        </div>
        {#if $errors.confirmPassword}
          <p class="mt-1 text-xs text-red-600">{$errors.confirmPassword}</p>
        {:else if passwordMismatch}
          <p class="mt-1 text-xs text-red-600">{m.change_password_mismatch()}</p>
        {/if}
      </div>

      <button
        type="submit"
        disabled={$delayed || passwordMismatch}
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
            {m.change_password_changing()}
          </span>
        {:else}
          {m.change_password_button()}
        {/if}
      </button>
    </form>

    <!-- Language selector -->
    <div class="mt-8 flex justify-center">
      <LanguageSwitcher />
    </div>
  </div>
</div>
