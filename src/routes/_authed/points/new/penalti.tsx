import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import * as m from '~/paraglide/messages'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { EmployeeSelector } from '~/components/points/employee-selector'
import { FileUpload } from '~/components/ui/file-upload'
import { getPointsLookupDataFn, submitPointFn } from '~/server/functions/points'
import { uploadFile } from '~/lib/upload'
import { KITTA_CODES, KITTA_LABELS, KITTA_DESCRIPTIONS } from '~/shared/constants'
import type { KittaCode } from '~/shared/constants'


export const Route = createFileRoute('/_authed/points/new/penalti')({
  loader: async () => {
    const data = await getPointsLookupDataFn()
    return data
  },
  component: PenaltiForm,
})

function getViolationDescriptions(): Record<number, string> {
  return {
    1: m.violation_1(),
    2: m.violation_2(),
    3: m.violation_3(),
    4: m.violation_4(),
    5: m.violation_5(),
    6: m.violation_6(),
    7: m.violation_7(),
    8: m.violation_8(),
    9: m.violation_9(),
    10: m.violation_10(),
  }
}

function PenaltiForm() {
  const { employees } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const violationDescriptions = getViolationDescriptions()

  const [userId, setUserId] = useState('')
  const [kittaComponent, setKittaComponent] = useState<KittaCode | ''>('')
  const [violationLevel, setViolationLevel] = useState(1)
  const [reason, setReason] = useState('')
  const [relatedStaff, setRelatedStaff] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!userId) return setError(m.form_error_select_employee())
    if (!kittaComponent) return setError(m.penalti_form_error_select_kitta())
    if (!reason.trim()) return setError(m.penalti_form_error_describe())
    if (!screenshotFile) return setError(m.form_error_screenshot_required())

    setIsSubmitting(true)
    try {
      const screenshotUrl = await uploadFile(screenshotFile)
      await submitPointFn({
        data: {
          userId,
          categoryCode: 'PENALTI',
          points: violationLevel,
          reason: reason.trim(),
          relatedStaff: relatedStaff.trim() || undefined,
          screenshotUrl,
          kittaComponent,
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
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-purple-50">
          <AlertTriangle className="h-5 w-5 text-purple-500" />
        </div>
        <h1 className="text-xl font-bold text-[#1D388B]">{m.penalti_form_title()}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>{m.form_staff_name()}</Label>
          <EmployeeSelector
            employees={employees}
            value={userId}
            onChange={setUserId}
            excludeId={session?.appUser?.id}
          />
        </div>

        <div className="space-y-2">
          <Label>{m.penalti_form_kitta_category()}</Label>
          <div className="space-y-2">
            {KITTA_CODES.map((code) => (
              <label
                key={code}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  kittaComponent === code
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="kitta"
                  value={code}
                  checked={kittaComponent === code}
                  onChange={() => setKittaComponent(code)}
                  className="mt-1 accent-purple-600"
                />
                <div>
                  <p className="text-sm font-medium">
                    {code} — {KITTA_LABELS[code]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {KITTA_DESCRIPTIONS[code]}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{m.penalti_form_violation_level({ level: String(violationLevel) })}</Label>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setViolationLevel(n)}
                className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                  violationLevel === n
                    ? 'border-purple-500 bg-purple-500 text-white shadow-sm'
                    : 'border-border bg-background text-foreground hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {violationDescriptions[violationLevel]}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">{m.penalti_form_incident()}</Label>
          <textarea
            id="reason"
            className="flex min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={m.penalti_form_incident_placeholder()}
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
            value={screenshotFile}
            onChange={setScreenshotFile}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#6D50B8] text-white hover:bg-[#5a3fa0] font-semibold"
        >
          {isSubmitting ? m.common_submitting() : m.penalti_form_submit()}
        </Button>
      </form>
    </div>
  )
}
