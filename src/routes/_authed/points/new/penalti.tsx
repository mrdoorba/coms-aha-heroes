import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import * as m from '~/paraglide/messages'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { EmployeeSelector } from '~/components/points/employee-selector'
import { FileUpload } from '~/components/ui/file-upload'
import { getPointsLookupDataFn, submitPointFn } from '~/server/functions/points'
import { uploadFile } from '~/lib/upload'
import { KITTA_CODES, KITTA_LABELS, KITTA_DESCRIPTIONS } from '~/shared/constants'
import type { UserRole } from '~/shared/constants'
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

// Severity band: 1-3 low, 4-6 medium, 7-10 high
function getSeverityBand(level: number): 'low' | 'medium' | 'high' {
  if (level <= 3) return 'low'
  if (level <= 6) return 'medium'
  return 'high'
}

const SEVERITY_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: 'Ringan',
  medium: 'Sedang',
  high: 'Berat',
}

const SEVERITY_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: 'text-amber-600 bg-amber-50 border-amber-200',
  medium: 'text-orange-600 bg-orange-50 border-orange-200',
  high: 'text-[#C73E3E] bg-red-50 border-red-200',
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#1D388B] text-white text-[10px] font-bold leading-none">
      {n}
    </span>
  )
}

function SectionCard({
  step,
  title,
  children,
}: {
  step: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/40">
        <StepBadge n={step} />
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function PenaltiForm() {
  const { employees } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const userRole = (session?.appUser?.role ?? 'employee') as UserRole
  const isSelfOnly = !(session?.appUser?.canSubmitPoints ?? false)
  const violationDescriptions = getViolationDescriptions()

  const [userId, setUserId] = useState(isSelfOnly ? (session?.appUser?.id ?? '') : '')
  const [kittaComponent, setKittaComponent] = useState<KittaCode | ''>('')
  const [violationLevel, setViolationLevel] = useState(1)
  const [reason, setReason] = useState('')
  const [relatedStaff, setRelatedStaff] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const severity = getSeverityBand(violationLevel)

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
    <div className="min-h-screen bg-background">
      {/* Page header — strong identity strip */}
      <div className="bg-[#1D388B] px-4 pt-5 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 text-sky-blue/70 text-xs font-medium mb-3">
            <span>Poin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/90">Catat Penalti</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-[#C73E3E]/20 border border-[#C73E3E]/30 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-[#E06B6B]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                {m.penalti_form_title()}
              </h1>
              <p className="text-sky-blue/70 text-xs mt-1">
                Isi semua bagian dengan teliti sebelum mengirim
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form body */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 page-transition">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Step 1 — Employee */}
          <SectionCard step={1} title={m.form_staff_name()}>
            {isSelfOnly ? (
              <div className="flex h-10 w-full items-center rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                {session?.appUser?.name ?? session?.user?.name}
              </div>
            ) : (
              <EmployeeSelector
                employees={employees}
                value={userId}
                onChange={setUserId}
                excludeId={session?.appUser?.id}
              />
            )}
          </SectionCard>

          {/* Step 2 — KITTA */}
          <SectionCard step={2} title={m.penalti_form_kitta_category()}>
            <div className="space-y-2">
              {KITTA_CODES.map((code) => (
                <label
                  key={code}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                    kittaComponent === code
                      ? 'border-[#C73E3E]/50 bg-red-50 shadow-sm'
                      : 'border-border hover:border-[#C73E3E]/20 hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="kitta"
                    value={code}
                    checked={kittaComponent === code}
                    onChange={() => setKittaComponent(code)}
                    className="mt-1 accent-[#C73E3E]"
                  />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${kittaComponent === code ? 'text-[#C73E3E]' : 'text-foreground'}`}>
                      {code}
                      <span className="font-normal text-foreground/80 ml-1">— {KITTA_LABELS[code]}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {KITTA_DESCRIPTIONS[code]}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </SectionCard>

          {/* Step 3 — Violation level */}
          <SectionCard step={3} title={m.penalti_form_violation_level({ level: String(violationLevel) })}>
            <div className="space-y-3">
              {/* Severity badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pilih tingkat pelanggaran</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[severity]}`}>
                  {SEVERITY_LABELS[severity]}
                </span>
              </div>

              {/* Number grid */}
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const band = getSeverityBand(n)
                  const isSelected = violationLevel === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setViolationLevel(n)}
                      className={`flex flex-col items-center justify-center h-11 rounded-lg border text-sm font-bold transition-all ${
                        isSelected
                          ? 'border-[#C73E3E] bg-[#C73E3E] text-white shadow-md scale-105'
                          : band === 'high'
                          ? 'border-red-200 bg-red-50/50 text-red-700 hover:border-[#C73E3E]/60 hover:bg-red-100'
                          : band === 'medium'
                          ? 'border-orange-200 bg-orange-50/50 text-orange-700 hover:border-orange-400 hover:bg-orange-100'
                          : 'border-amber-200 bg-amber-50/50 text-amber-700 hover:border-amber-400 hover:bg-amber-100'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>

              {/* Description callout */}
              <div className="rounded-lg bg-muted/60 border border-border px-3 py-2.5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {violationDescriptions[violationLevel]}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Step 4 — Reason */}
          <SectionCard step={4} title={m.penalti_form_incident()}>
            <textarea
              id="reason"
              className="flex min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C73E3E]/40 focus-visible:border-[#C73E3E]/50 transition-colors resize-none"
              placeholder={m.penalti_form_incident_placeholder()}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-muted-foreground">{reason.length}/1000</span>
            </div>
          </SectionCard>

          {/* Step 5 — Related staff (optional) */}
          <SectionCard step={5} title={m.form_related_staff()}>
            <input
              id="relatedStaff"
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C73E3E]/40 focus-visible:border-[#C73E3E]/50 transition-colors"
              placeholder={m.form_related_staff_placeholder()}
              value={relatedStaff}
              onChange={(e) => setRelatedStaff(e.target.value)}
              maxLength={500}
            />
          </SectionCard>

          {/* Step 6 — Screenshot */}
          <SectionCard step={6} title={m.form_screenshot_required()}>
            <FileUpload
              value={screenshotFile}
              onChange={setScreenshotFile}
              required
            />
          </SectionCard>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive leading-snug">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-gradient-red text-white font-semibold h-11 rounded-xl shadow-md"
          >
            {isSubmitting ? m.common_submitting() : m.penalti_form_submit()}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground pb-2">
            Data penalti akan tercatat dan menjadi bagian dari rekam jejak anggota
          </p>
        </form>
      </div>
    </div>
  )
}
