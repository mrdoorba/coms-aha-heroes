import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Star } from 'lucide-react'
import * as m from '~/paraglide/messages'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { EmployeeSelector } from '~/components/points/employee-selector'
import { FileUpload } from '~/components/ui/file-upload'
import { getPointsLookupDataFn, submitPointFn } from '~/server/functions/points'
import type { UserRole } from '~/shared/constants'

export const Route = createFileRoute('/_authed/points/new/bintang')({
  loader: async () => {
    const data = await getPointsLookupDataFn()
    return data
  },
  component: BintangForm,
})

function BintangForm() {
  const { employees } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const userRole = (session?.appUser?.role ?? 'employee') as UserRole

  const [userId, setUserId] = useState('')
  const [reason, setReason] = useState('')
  const [relatedStaff, setRelatedStaff] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSelfSubmission = userId === session?.appUser?.id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!userId) return setError(m.form_error_select_employee())
    if (!reason.trim()) return setError(m.form_error_provide_reason())
    if (!screenshotUrl) return setError(m.form_error_screenshot_required())

    setIsSubmitting(true)
    try {
      await submitPointFn({
        data: {
          userId,
          categoryCode: 'BINTANG',
          points: 1,
          reason: reason.trim(),
          relatedStaff: relatedStaff.trim() || undefined,
          screenshotUrl,
        },
      })
      await router.invalidate()
      router.navigate({ to: '/points' })
    } catch (err) {
      setError(err instanceof Error ? err.message : m.form_error_submission_failed())
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-yellow-50">
          <Star className="h-5 w-5 text-yellow-500" />
        </div>
        <h1 className="text-xl font-bold text-[#1D388B]">{m.bintang_form_title()}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>{m.form_staff_name()}</Label>
          <EmployeeSelector
            employees={employees}
            value={userId}
            onChange={setUserId}
            excludeId={userRole === 'leader' ? session?.appUser?.id : undefined}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">{m.bintang_form_action()}</Label>
          <textarea
            id="reason"
            className="flex min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={m.bintang_form_action_placeholder()}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="relatedStaff">{m.form_related_staff()}</Label>
          <input
            id="relatedStaff"
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={m.form_related_staff_placeholder()}
            value={relatedStaff}
            onChange={(e) => setRelatedStaff(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label>{m.form_screenshot_required()}</Label>
          <FileUpload
            value={screenshotUrl}
            onChange={setScreenshotUrl}
            required
          />
        </div>

        {isSelfSubmission && userRole === 'employee' && (
          <p className="text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            {m.form_pending_approval()}
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#F4C144] text-[#1D388B] hover:bg-[#e5b33a] font-semibold"
        >
          {isSubmitting ? m.common_submitting() : m.bintang_form_submit()}
        </Button>
      </form>
    </div>
  )
}
