<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import * as Table from '$lib/components/ui/table'

  let { data } = $props()

  const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    admin: 'default',
    hr: 'secondary',
    leader: 'outline',
    member: 'outline',
  }

  function roleVariant(role: string): 'default' | 'secondary' | 'outline' | 'destructive' {
    return ROLE_VARIANT[role] ?? 'outline'
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Users</h1>
      <p class="text-sm text-muted-foreground">{data.meta.total} total users</p>
    </div>
    <Button href="/admin/users/new" size="sm">+ Add User</Button>
  </div>

  <div class="rounded-lg border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Name</Table.Head>
          <Table.Head>Email</Table.Head>
          <Table.Head>Role</Table.Head>
          <Table.Head>Team</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head class="text-right">Actions</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.users as user (user.id)}
          <Table.Row>
            <Table.Cell class="font-medium">{user.name}</Table.Cell>
            <Table.Cell class="text-muted-foreground">{user.email}</Table.Cell>
            <Table.Cell>
              <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
            </Table.Cell>
            <Table.Cell>{user.teamName ?? '—'}</Table.Cell>
            <Table.Cell>
              <Badge variant={user.isActive ? 'default' : 'destructive'}>
                {user.isActive ? 'Active' : 'Archived'}
              </Badge>
            </Table.Cell>
            <Table.Cell class="text-right">
              <Button href="/admin/users/{user.id}" variant="outline" size="sm">Edit</Button>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={6} class="py-8 text-center text-muted-foreground">
              No users found.
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</div>
