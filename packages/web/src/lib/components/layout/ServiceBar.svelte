<script lang="ts">
  import { Moon, Sun, User } from 'lucide-svelte'
  import { uiState } from '$lib/state/uiState.svelte'

  let { user, avatarUrl }: { user: { name: string; role: string }; avatarUrl?: string | null } = $props()

  const initials = $derived(
    user?.name
      ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
      : '',
  )

  const firstName = $derived(user?.name?.split(' ')[0] ?? '')

  function toggleDark() {
    uiState.setTheme(uiState.theme === 'dark' ? 'light' : 'dark')
  }
</script>

<div class="fixed top-0 left-0 right-0 z-[70] h-9 flex items-center justify-between bg-gradient-to-r from-deep-navy to-primary-dark border-b border-white/8 px-3">
  <!-- Left: service tabs -->
  <div class="flex items-center gap-1">
    <a
      href="https://PORTAL_ORIGIN_PLACEHOLDER"
      target="_blank"
      rel="noopener noreferrer"
      class="flex h-6 items-center px-2.5 rounded text-[11px] font-semibold text-white/45 hover:text-white/80 hover:bg-white/6 transition-colors"
    >
      COMS
    </a>
    <div class="flex h-6 items-center px-2.5 rounded text-[11px] font-semibold bg-white/10 text-gold cursor-default">
      Heroes
    </div>
  </div>

  <!-- Right: dark-mode toggle, avatar, name -->
  <div class="flex items-center gap-2">
    <button
      type="button"
      onclick={toggleDark}
      class="flex h-6 w-6 items-center justify-center rounded text-white/45 hover:text-white/80 hover:bg-white/6 transition-colors"
      aria-label={uiState.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {#if uiState.theme === 'dark'}
        <Sun class="h-3.5 w-3.5" />
      {:else}
        <Moon class="h-3.5 w-3.5" />
      {/if}
    </button>

    <div class="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-primary/30 text-[8px] font-bold text-primary-light ring-1 ring-white/15">
      {#if avatarUrl}
        <img
          src={avatarUrl}
          alt={user?.name ?? ''}
          class="h-full w-full object-cover"
          width={20}
          height={20}
          loading="lazy"
          decoding="async"
        />
      {:else if initials}
        <span>{initials}</span>
      {:else}
        <User class="h-3 w-3" />
      {/if}
    </div>

    <span class="text-[11px] font-semibold text-white/70">{firstName}</span>
  </div>
</div>
