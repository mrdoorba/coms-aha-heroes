<script lang="ts">
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import Header from '$lib/components/layout/Header.svelte'
  import TopBar from '$lib/components/layout/TopBar.svelte'
  import MobileNav from '$lib/components/layout/MobileNav.svelte'
  import PullToRefresh from '$lib/components/ui/PullToRefresh.svelte'
  import { uiState } from '$lib/state/uiState.svelte'
  import { userState } from '$lib/state/userState.svelte'

  let { data, children } = $props()
  // data contains { user, avatarUrl, unreadCount }

  $effect(() => {
    userState.init(data.user)
  })

  $effect(() => {
    uiState.initEffects()
  })
</script>

<div class="app-bg min-h-screen {uiState.sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}">
  <TopBar
    user={data.user}
    avatarUrl={data.avatarUrl}
    unreadCount={data.unreadCount}
    onOpenPalette={() => { /* TODO Phase 4 */ }}
  />
  <Sidebar avatarUrl={data.avatarUrl} />
  <div class="md:ml-[var(--sidebar-width)] transition-[margin-left] duration-200">
    <Header
      avatarUrl={data.avatarUrl}
      unreadCount={data.unreadCount}
      onOpenPalette={() => { /* TODO Phase 4 */ }}
    />
    <PullToRefresh>
      <main class="page-transition pt-14 pb-16 md:pt-0 md:pb-0 px-4 md:px-6 max-w-screen-xl mx-auto">
        {@render children()}
      </main>
    </PullToRefresh>
  </div>
  <MobileNav />
</div>
