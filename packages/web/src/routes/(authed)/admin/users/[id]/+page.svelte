<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  const { user } = $derived(data)

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
</script>

<div class="space-y-4">
  <div class="flex items-center gap-2">
    <Button href="/admin/users" variant="outline" size="sm">&larr; {m.common_previous()}</Button>
    <h1 class="text-2xl font-bold">{m.common_edit()} {m.nav_users()}</h1>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>{user.name}</Card.Title>
      <Card.Description>{user.email}</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p class="text-xs text-muted-foreground">{m.users_col_role()}</p>
          <Badge class="mt-1">{user.role}</Badge>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">{m.users_col_status()}</p>
          <Badge variant={user.isActive ? 'default' : 'destructive'} class="mt-1">
            {user.isActive ? m.status_active() : m.status_archived()}
          </Badge>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">{m.employee_detail_col_date()}</p>
          <p class="mt-1 text-sm font-medium">{formatDate(user.createdAt)}</p>
        </div>
        {#if user.teamName}
          <div>
            <p class="text-xs text-muted-foreground">{m.users_col_team()}</p>
            <p class="mt-1 text-sm font-medium">{user.teamName}</p>
          </div>
        {/if}
        {#if user.department}
          <div>
            <p class="text-xs text-muted-foreground">{m.users_col_department()}</p>
            <p class="mt-1 text-sm font-medium">{user.department}</p>
          </div>
        {/if}
        {#if user.position}
          <div>
            <p class="text-xs text-muted-foreground">{m.profile_position()}</p>
            <p class="mt-1 text-sm font-medium">{user.position}</p>
          </div>
        {/if}
      </div>

      <div class="border-t pt-4">
        <div class="space-y-3">
          <div>
            <label for="name" class="text-sm text-muted-foreground">{m.users_col_name()}</label>
            <input
              id="name"
              type="text"
              value={user.name}
              class="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled
            />
          </div>
          <div>
            <label for="role" class="text-sm text-muted-foreground">{m.users_col_role()}</label>
            <select
              id="role"
              class="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled
            >
              <option value={user.role}>{user.role}</option>
            </select>
          </div>
        </div>
      </div>
    </Card.Content>
  </Card.Root>
</div>
