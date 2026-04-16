<script lang="ts">
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import Header from '$lib/components/layout/Header.svelte'
  import MobileNav from '$lib/components/layout/MobileNav.svelte'

  let { children } = $props()
  let mobileMenuOpen = $state(false)
</script>

<div class="flex min-h-screen bg-background">
  <Sidebar />
  <div class="flex flex-1 flex-col">
    <Header onMenuClick={() => (mobileMenuOpen = true)} />
    <main class="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
      {@render children()}
    </main>
  </div>
  <MobileNav />
</div>
