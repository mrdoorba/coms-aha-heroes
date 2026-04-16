<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { userState } from '$lib/state/userState.svelte'

  const user = $derived(userState.current)

  const roleLabel: Record<string, string> = {
    admin: 'Admin',
    hr: 'HR',
    leader: 'Ketua Tim',
    member: 'Anggota',
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Profil</h1>
    <p class="text-muted-foreground">Informasi akun dan keanggotaan kamu.</p>
  </div>

  {#if user}
    <Card.Root class="mx-auto max-w-lg">
      <Card.Header>
        <div class="flex items-center gap-4">
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary"
          >
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Card.Title class="text-lg">{user.name}</Card.Title>
            <Card.Description>{user.email}</Card.Description>
          </div>
        </div>
      </Card.Header>

      <Card.Content>
        <dl class="divide-y">
          <div class="flex items-center justify-between py-3">
            <dt class="text-sm text-muted-foreground">Peran</dt>
            <dd>
              <Badge variant="secondary">{roleLabel[user.role] ?? user.role}</Badge>
            </dd>
          </div>

          <div class="flex items-center justify-between py-3">
            <dt class="text-sm text-muted-foreground">Email</dt>
            <dd class="text-sm font-medium">{user.email}</dd>
          </div>

          <div class="flex items-center justify-between py-3">
            <dt class="text-sm text-muted-foreground">Cabang</dt>
            <dd class="text-sm font-medium">{user.branchId}</dd>
          </div>

          <div class="flex items-center justify-between py-3">
            <dt class="text-sm text-muted-foreground">Tim</dt>
            <dd class="text-sm font-medium">
              {#if user.teamId}
                {user.teamId}
              {:else}
                <span class="text-muted-foreground">Tidak ada tim</span>
              {/if}
            </dd>
          </div>

          <div class="flex items-center justify-between py-3">
            <dt class="text-sm text-muted-foreground">Submit poin</dt>
            <dd>
              <Badge variant={user.canSubmitPoints ? 'default' : 'secondary'}>
                {user.canSubmitPoints ? 'Diizinkan' : 'Tidak diizinkan'}
              </Badge>
            </dd>
          </div>
        </dl>
      </Card.Content>
    </Card.Root>
  {:else}
    <Card.Root>
      <Card.Content class="py-10 text-center text-muted-foreground">
        Memuat data profil...
      </Card.Content>
    </Card.Root>
  {/if}
</div>
