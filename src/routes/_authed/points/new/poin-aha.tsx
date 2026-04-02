import { useState, useEffect } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Award } from 'lucide-react'
import * as m from '~/paraglide/messages'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { EmployeeSelector } from '~/components/points/employee-selector'
import { FileUpload } from '~/components/ui/file-upload'
import { getPointsLookupDataFn, submitPointFn } from '~/server/functions/points'
import { uploadFile } from '~/lib/upload'
import type { UserRole } from '~/shared/constants'

export const Route = createFileRoute('/_authed/points/new/poin-aha')({
  loader: async () => {
    const data = await getPointsLookupDataFn()
    return data
  },
  component: PoinAhaForm,
})

function PoinAhaForm() {
  const { employees } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const userRole = (session?.appUser?.role ?? 'employee') as UserRole

  const [userId, setUserId] = useState('')
  const [level, setLevel] = useState(1)
  const [reason, setReason] = useState('')
  const [relatedStaff, setRelatedStaff] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSelfSubmission = userId === session?.appUser?.id

  // Employees cannot give Poin AHA — redirect to dashboard
  useEffect(() => {
    if (userRole === 'employee') {
      router.navigate({ to: '/dashboard' })
    }
  }, [userRole, router])

  if (userRole === 'employee') return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!userId) return setError(m.form_error_select_employee())
    if (!reason.trim()) return setError(m.poin_aha_form_error_describe())

    setIsSubmitting(true)
    try {
      const screenshotUrl = screenshotFile ? await uploadFile(screenshotFile) : undefined
      await submitPointFn({
        data: {
          userId,
          categoryCode: 'POIN_AHA',
          points: level,
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
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50">
          <Award className="h-5 w-5 text-blue-500" />
        </div>
        <h1 className="text-xl font-bold text-[#1D388B]">{m.poin_aha_form_title()}</h1>
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
          <Label htmlFor="reason">{m.poin_aha_form_activity()}</Label>
          <textarea
            id="reason"
            className="flex min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={m.poin_aha_form_activity_placeholder()}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
          />
        </div>

        <div className="space-y-2">
          <Label>{m.poin_aha_form_level({ level: String(level) })}</Label>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLevel(n)}
                className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                  level === n
                    ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                    : 'border-border bg-background text-foreground hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
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
          <Label>{m.form_screenshot_optional()}</Label>
          <FileUpload
            value={screenshotFile}
            onChange={setScreenshotFile}
          />
        </div>


        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#325FEC] text-white hover:bg-[#1D388B] font-semibold"
        >
          {isSubmitting ? m.common_submitting() : m.poin_aha_form_submit()}
        </Button>
      </form>
    </div>
  )
}
