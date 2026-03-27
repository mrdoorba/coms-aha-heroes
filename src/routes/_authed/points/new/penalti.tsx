import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { EmployeeSelector } from '~/components/points/employee-selector'
import { FileUpload } from '~/components/ui/file-upload'
import { getPointsLookupDataFn, submitPointFn } from '~/server/functions/points'
import { KITTA_CODES, KITTA_LABELS, KITTA_DESCRIPTIONS } from '~/shared/constants'
import type { KittaCode } from '~/shared/constants'

const VIOLATION_DESCRIPTIONS: Record<number, string> = {
  1: 'Tidak sesuai SOP',
  2: 'Berdampak terhadap member lain',
  3: 'Berdampak terhadap pihak luar',
  4: 'Menimbulkan kerugian finansial',
  5: 'Menimbulkan kerugian finansial',
  6: 'Pelanggaran berat',
  7: 'Pelanggaran berat',
  8: 'Pelanggaran berat',
  9: 'Pelanggaran berat',
  10: 'Pelanggaran berat',
}

export const Route = createFileRoute('/_authed/points/new/penalti')({
  loader: async () => {
    const data = await getPointsLookupDataFn()
    return data
  },
  component: PenaltiForm,
})

function PenaltiForm() {
  const { employees } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const navigate = useNavigate()

  const [userId, setUserId] = useState('')
  const [kittaComponent, setKittaComponent] = useState<KittaCode | ''>('')
  const [violationLevel, setViolationLevel] = useState(1)
  const [reason, setReason] = useState('')
  const [relatedStaff, setRelatedStaff] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!userId) return setError('Please select an employee')
    if (!kittaComponent) return setError('Please select a KITTA category')
    if (!reason.trim()) return setError('Please describe the violation')
    if (!screenshotUrl) return setError('Screenshot is required')

    setIsSubmitting(true)
    try {
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
      navigate({ to: '/points' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
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
        <h1 className="text-xl font-bold text-[#1D388B]">Record Penalti</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nama Staff</Label>
          <EmployeeSelector
            employees={employees}
            value={userId}
            onChange={setUserId}
            excludeId={session?.appUser?.id}
          />
        </div>

        <div className="space-y-2">
          <Label>KITTA Category</Label>
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
          <Label>Violation Level: {violationLevel}</Label>
          <input
            type="range"
            min={1}
            max={10}
            value={violationLevel}
            onChange={(e) => setViolationLevel(Number(e.target.value))}
            className="w-full accent-purple-600"
          />
          <p className="text-sm text-muted-foreground">
            {VIOLATION_DESCRIPTIONS[violationLevel]}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Kejadian</Label>
          <textarea
            id="reason"
            className="flex min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="[siapa] [apa] sehingga [dampak]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="relatedStaff">Related Staff (optional)</Label>
          <input
            id="relatedStaff"
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Names of related staff"
            value={relatedStaff}
            onChange={(e) => setRelatedStaff(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label>Screenshot (required)</Label>
          <FileUpload
            value={screenshotUrl}
            onChange={setScreenshotUrl}
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
          {isSubmitting ? 'Submitting...' : 'Submit Penalti'}
        </Button>
      </form>
    </div>
  )
}
