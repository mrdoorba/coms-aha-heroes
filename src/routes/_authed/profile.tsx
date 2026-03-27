import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-2 text-muted-foreground">Coming soon.</p>
    </div>
  )
}
