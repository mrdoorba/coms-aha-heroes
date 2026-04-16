<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'

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
    <Button href="/admin/users" variant="outline" size="sm">← Back</Button>
    <h1 class="text-2xl font-bold">Edit User</h1>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>{user.name}</Card.Title>
      <Card.Description>{user.email}</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p class="text-xs text-muted-foreground">Role</p>
          <Badge class="mt-1">{user.role}</Badge>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Status</p>
          <Badge variant={user.isActive ? 'default' : 'destructive'} class="mt-1">
            {user.isActive ? 'Active' : 'Archived'}
          </Badge>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Member since</p>
          <p class="mt-1 text-sm font-medium">{formatDate(user.createdAt)}</p>
        </div>
        {#if user.teamName}
          <div>
            <p class="text-xs text-muted-foreground">Team</p>
            <p class="mt-1 text-sm font-medium">{user.teamName}</p>
          </div>
        {/if}
        {#if user.department}
          <div>
            <p class="text-xs text-muted-foreground">Department</p>
            <p class="mt-1 text-sm font-medium">{user.department}</p>
          </div>
        {/if}
        {#if user.position}
          <div>
            <p class="text-xs text-muted-foreground">Position</p>
            <p class="mt-1 text-sm font-medium">{user.position}</p>
          </div>
        {/if}
      </div>

      <div class="border-t pt-4">
        <p class="mb-3 text-sm font-medium">Editable Fields</p>
        <div class="space-y-3">
          <div>
            <label for="name" class="text-sm text-muted-foreground">Name</label>
            <input
              id="name"
              type="text"
              value={user.name}
              class="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled
            />
          </div>
          <div>
            <label for="role" class="text-sm text-muted-foreground">Role</label>
            <select
              id="role"
              class="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled
            >
              <option value={user.role}>{user.role}</option>
            </select>
          </div>
        </div>
        <p class="mt-3 text-xs text-muted-foreground">
          Editing via API — full edit form coming soon.
        </p>
      </div>
    </Card.Content>
  </Card.Root>
</div>
