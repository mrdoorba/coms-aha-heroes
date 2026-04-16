<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import * as Table from '$lib/components/ui/table'
  import * as m from '$lib/paraglide/messages'

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
      <h1 class="text-2xl font-bold">{m.nav_users()}</h1>
      <p class="text-sm text-muted-foreground">{m.users_total({ count: data.meta.total })}</p>
    </div>
    <Button href="/admin/users/new" size="sm">+ {m.users_add()}</Button>
  </div>

  <div class="rounded-lg border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>{m.users_col_name()}</Table.Head>
          <Table.Head>{m.login_email()}</Table.Head>
          <Table.Head>{m.users_col_role()}</Table.Head>
          <Table.Head>{m.users_col_team()}</Table.Head>
          <Table.Head>{m.users_col_status()}</Table.Head>
          <Table.Head class="text-right">{m.common_edit()}</Table.Head>
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
                {user.isActive ? m.status_active() : m.status_archived()}
              </Badge>
            </Table.Cell>
            <Table.Cell class="text-right">
              <Button href="/admin/users/{user.id}" variant="outline" size="sm">{m.common_edit()}</Button>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={6} class="py-8 text-center text-muted-foreground">
              {m.users_empty()}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</div>
