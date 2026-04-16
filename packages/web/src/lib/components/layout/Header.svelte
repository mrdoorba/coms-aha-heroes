<script lang="ts">
  import { Menu, User, LogOut } from 'lucide-svelte'
  import Icon from '$lib/components/Icon.svelte'
  import { Button } from '$lib/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu'
  import { userState } from '$lib/state/userState.svelte'
  import { signOut } from '$lib/auth/client'
  import { goto, invalidateAll } from '$app/navigation'

  let { onMenuClick }: { onMenuClick: () => void } = $props()

  async function handleSignOut() {
    await signOut()
    await invalidateAll()
    goto('/login')
  }
</script>

<header class="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
  <!-- Mobile menu button -->
  <button
    onclick={onMenuClick}
    class="md:hidden p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    aria-label="Open menu"
  >
    <Icon icon={Menu} size={20} strokeWidth={1.5} />
  </button>

  <!-- Spacer -->
  <div class="flex-1"></div>

  <!-- User dropdown -->
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button variant="ghost" class="flex items-center gap-2 px-2">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
          <Icon icon={User} size={16} strokeWidth={1.5} />
        </div>
        <span class="hidden sm:block text-sm font-medium text-foreground">
          {userState.current?.name ?? 'User'}
        </span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel>
        <div class="flex flex-col space-y-1">
          <p class="text-sm font-medium leading-none">{userState.current?.name ?? 'User'}</p>
          <p class="text-xs leading-none text-muted-foreground">{userState.current?.email ?? ''}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <a href="/profile" class="flex items-center gap-2 w-full">
          <Icon icon={User} size={16} strokeWidth={1.5} />
          Profile
        </a>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onclick={handleSignOut} class="text-destructive focus:text-destructive cursor-pointer">
        <Icon icon={LogOut} size={16} strokeWidth={1.5} class="mr-2" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</header>
