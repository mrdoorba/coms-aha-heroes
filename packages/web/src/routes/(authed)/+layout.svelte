<script lang="ts">
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import Header from '$lib/components/layout/Header.svelte'
  import MobileNav from '$lib/components/layout/MobileNav.svelte'
  import { uiState } from '$lib/state/uiState.svelte'

  let { children } = $props()
</script>

<div class="app-bg min-h-screen {uiState.sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}">
  <Sidebar />
  <div class="md:ml-[var(--sidebar-width)] transition-[margin-left] duration-200">
    <Header onMenuClick={() => { /* placeholder */ }} />
    <main class="page-transition pt-14 pb-16 md:pt-0 md:pb-0 px-4 md:px-6 max-w-screen-xl mx-auto">
      {@render children()}
    </main>
  </div>
  <MobileNav />
</div>
