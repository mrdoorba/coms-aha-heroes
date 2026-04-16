<script lang="ts">
  import { userState } from '$lib/state/userState.svelte'

  let { data, children } = $props()
</script>

<div class="flex min-h-screen bg-background">
  <main class="flex-1 p-6">
    {@render children()}
  </main>
</div>
