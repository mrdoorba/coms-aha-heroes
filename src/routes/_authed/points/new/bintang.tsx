import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Star, AlertTriangle, ChevronRight } from 'lucide-react'
import * as m from '~/paraglide/messages'
import { Button } from '~/components/ui/button'
import { EmployeeSelector } from '~/components/points/employee-selector'
import { FileUpload } from '~/components/ui/file-upload'
import { getPointsLookupDataFn, submitPointFn } from '~/server/functions/points'
import { uploadFile } from '~/lib/upload'
import type { UserRole } from '~/shared/constants'

export const Route = createFileRoute('/_authed/points/new/bintang')({
  loader: async () => {
    const data = await getPointsLookupDataFn()
    return data
  },
  component: BintangForm,
})

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#D4962A] text-white text-[10px] font-bold leading-none">
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

function BintangForm() {
  const { employees } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const userRole = (session?.appUser?.role ?? 'employee') as UserRole

  const isEmployee = userRole === 'employee'
  const [userId, setUserId] = useState(isEmployee ? (session?.appUser?.id ?? '') : '')
  const [reason, setReason] = useState('')
  const [relatedStaff, setRelatedStaff] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!userId) return setError(m.form_error_select_employee())
    if (!reason.trim()) return setError(m.form_error_provide_reason())
    if (!screenshotFile) return setError(m.form_error_screenshot_required())

    setIsSubmitting(true)
    try {
      const screenshotUrl = await uploadFile(screenshotFile)
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
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-[#1D388B] px-4 pt-5 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 text-sky-blue/70 text-xs font-medium mb-3">
            <span>Poin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/90">Catat Bintang</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-[#F4C144]/20 border border-[#F4C144]/30 mt-0.5">
              <Star className="w-5 h-5 text-[#F4C144]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                {m.bintang_form_title()}
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
            {isEmployee ? (
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

          {/* Step 2 — Action / Reason */}
          <SectionCard step={2} title={m.bintang_form_action()}>
            <textarea
              id="reason"
              className="flex min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C144]/40 focus-visible:border-[#F4C144]/50 transition-colors resize-none"
              placeholder={m.bintang_form_action_placeholder()}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-muted-foreground">{reason.length}/1000</span>
            </div>
          </SectionCard>

          {/* Step 3 — Related staff (optional) */}
          <SectionCard step={3} title={m.form_related_staff()}>
            <input
              id="relatedStaff"
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C144]/40 focus-visible:border-[#F4C144]/50 transition-colors"
              placeholder={m.form_related_staff_placeholder()}
              value={relatedStaff}
              onChange={(e) => setRelatedStaff(e.target.value)}
              maxLength={500}
            />
          </SectionCard>

          {/* Step 4 — Screenshot (required) */}
          <SectionCard step={4} title={m.form_screenshot_required()}>
            <FileUpload
              value={screenshotFile}
              onChange={setScreenshotFile}
              required
            />
          </SectionCard>

          {/* Pending approval notice for employees */}
          {isEmployee && (
            <div className="flex items-start gap-2.5 rounded-lg border border-[#F4C144]/40 bg-amber-50 px-3 py-2.5">
              <Star className="w-4 h-4 text-[#D4962A] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800 leading-snug">{m.form_pending_approval()}</p>
            </div>
          )}

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
            className="w-full bg-[#F4C144] hover:bg-[#D4962A] text-[#1D388B] font-semibold h-11 rounded-xl shadow-md transition-colors"
          >
            {isSubmitting ? m.common_submitting() : m.bintang_form_submit()}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground pb-2">
            Bintang yang tercatat akan berkontribusi pada rekam jejak anggota
          </p>
        </form>
      </div>
    </div>
  )
}
