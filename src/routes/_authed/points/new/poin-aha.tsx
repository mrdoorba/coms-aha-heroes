import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Award, AlertTriangle, ChevronRight } from 'lucide-react'
import * as m from '~/paraglide/messages'
import { Button } from '~/components/ui/button'
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

// Impact band: 1-3 low, 4-6 medium, 7-10 high
function getImpactBand(level: number): 'low' | 'medium' | 'high' {
  if (level <= 3) return 'low'
  if (level <= 6) return 'medium'
  return 'high'
}

const IMPACT_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: 'Kecil',
  medium: 'Sedang',
  high: 'Besar',
}

const IMPACT_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: 'text-sky-600 bg-sky-50 border-sky-200',
  medium: 'text-[#325FEC] bg-blue-50 border-blue-200',
  high: 'text-blue-700 bg-blue-100 border-blue-300',
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#325FEC] text-white text-[10px] font-bold leading-none">
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

function PoinAhaForm() {
  const { employees } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const userRole = (session?.appUser?.role ?? 'employee') as UserRole
  const isSelfOnly = !(session?.appUser?.canSubmitPoints ?? false)

  const [userId, setUserId] = useState(isSelfOnly ? (session?.appUser?.id ?? '') : '')
  const [level, setLevel] = useState(1)
  const [reason, setReason] = useState('')
  const [relatedStaff, setRelatedStaff] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const impact = getImpactBand(level)

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
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-[#1D388B] px-4 pt-5 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 text-sky-blue/70 text-xs font-medium mb-3">
            <span>Poin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/90">Catat Poin AHA</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-[#325FEC]/20 border border-[#325FEC]/30 mt-0.5">
              <Award className="w-5 h-5 text-[#7B9FFF]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                {m.poin_aha_form_title()}
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
                excludeId={userRole === 'leader' ? session?.appUser?.id : undefined}
              />
            )}
          </SectionCard>

          {/* Step 2 — Reason / Activity */}
          <SectionCard step={2} title={m.poin_aha_form_activity()}>
            <textarea
              id="reason"
              className="flex min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#325FEC]/40 focus-visible:border-[#325FEC]/50 transition-colors resize-none"
              placeholder={m.poin_aha_form_activity_placeholder()}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-muted-foreground">{reason.length}/1000</span>
            </div>
          </SectionCard>

          {/* Step 3 — Level */}
          <SectionCard step={3} title={m.poin_aha_form_level({ level: String(level) })}>
            <div className="space-y-3">
              {/* Impact badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pilih tingkat dampak</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${IMPACT_COLORS[impact]}`}>
                  {IMPACT_LABELS[impact]}
                </span>
              </div>

              {/* Number grid */}
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const band = getImpactBand(n)
                  const isSelected = level === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setLevel(n)}
                      className={`flex flex-col items-center justify-center h-11 rounded-lg border text-sm font-bold transition-all ${
                        isSelected
                          ? 'border-[#325FEC] bg-[#325FEC] text-white shadow-md scale-105'
                          : band === 'high'
                          ? 'border-blue-200 bg-blue-50/50 text-blue-700 hover:border-[#325FEC]/60 hover:bg-blue-100'
                          : band === 'medium'
                          ? 'border-sky-200 bg-sky-50/50 text-sky-700 hover:border-sky-400 hover:bg-sky-100'
                          : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          </SectionCard>

          {/* Step 4 — Related staff (optional) */}
          <SectionCard step={4} title={m.form_related_staff()}>
            <input
              id="relatedStaff"
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#325FEC]/40 focus-visible:border-[#325FEC]/50 transition-colors"
              placeholder={m.form_related_staff_placeholder()}
              value={relatedStaff}
              onChange={(e) => setRelatedStaff(e.target.value)}
              maxLength={500}
            />
          </SectionCard>

          {/* Step 5 — Screenshot (optional) */}
          <SectionCard step={5} title={m.form_screenshot_optional()}>
            <FileUpload
              value={screenshotFile}
              onChange={setScreenshotFile}
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
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold h-11 rounded-xl shadow-md transition-colors"
          >
            {isSubmitting ? m.common_submitting() : m.poin_aha_form_submit()}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground pb-2">
            Poin AHA akan tercatat dan berkontribusi pada skor anggota
          </p>
        </form>
      </div>
    </div>
  )
}
