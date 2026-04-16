<script lang="ts">
  let { children } = $props()
</script>

<div class="border-b border-yellow-500 bg-yellow-500/10 px-4 py-1 text-center text-xs text-yellow-700">
  BETA — You are viewing the new SvelteKit interface
</div>
{@render children()}
