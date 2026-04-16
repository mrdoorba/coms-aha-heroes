<script lang="ts">
  import { onMount } from 'svelte'
  import { userState } from '$lib/state/userState.svelte'
  import { Toaster } from 'svelte-sonner'
  import '../app.css'

  let { data, children } = $props()

  onMount(() => {
    userState.init(data.user)
  })

  $effect(() => {
    userState.init(data.user)
  })
</script>

<Toaster richColors position="top-right" />
{@render children()}
