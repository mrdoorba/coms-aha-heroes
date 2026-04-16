<script lang="ts">
  import { page } from '$app/stores'
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
  <h1 class="text-4xl font-bold text-foreground">{$page.status}</h1>
  <p class="text-muted-foreground">{$page.error?.message ?? 'Something went wrong'}</p>
  <a href="/" class="text-primary underline">Go home</a>
</div>
