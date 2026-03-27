import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, User } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { CategoryIcon } from '~/components/points/category-icon'
import { StatusBadge } from '~/components/points/status-badge'
import { getPointByIdFn } from '~/server/functions/points'
import { KITTA_LABELS } from '~/shared/constants'
import type { PointCategoryCode, PointStatus, KittaCode } from '~/shared/constants'

export const Route = createFileRoute('/_authed/points/$id')({
  loader: async ({ params }) => {
    const point = await getPointByIdFn({ data: { id: params.id } })
    return { point }
  },
  component: PointDetailPage,
})

function PointDetailPage() {
  const { point } = Route.useLoaderData()

  const categoryCode = (point.category?.code ?? 'BINTANG') as PointCategoryCode
  const pointColor =
    categoryCode === 'PENALTI'
      ? 'text-purple-600'
      : categoryCode === 'BINTANG'
        ? 'text-yellow-600'
        : 'text-blue-600'

  const prefix = categoryCode === 'PENALTI' ? '-' : '+'

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/points">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-[#1D388B]">Point Detail</h1>
      </div>

      {/* Main info card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <CategoryIcon code={categoryCode} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">
                  {point.category?.defaultName ?? categoryCode}
                </span>
                <StatusBadge status={point.status as PointStatus} />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {new Date(point.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <span className={`text-2xl font-bold ${pointColor}`}>
            {prefix}{point.points}
          </span>
        </div>

        {/* Recipient */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Recipient</p>
            <p className="text-sm font-medium">{point.user?.name ?? 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{point.user?.email}</p>
          </div>
        </div>

        {/* Submitted by */}
        {point.submitter && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submitted by</p>
              <p className="text-sm font-medium">{point.submitter.name}</p>
              <p className="text-xs text-muted-foreground">{point.submitter.role}</p>
            </div>
          </div>
        )}

        {/* Reason */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Reason</p>
          <p className="text-sm leading-relaxed">{point.reason}</p>
        </div>

        {/* KITTA (Penalti only) */}
        {categoryCode === 'PENALTI' && point.kittaComponent && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="text-xs text-purple-600 mb-1">KITTA Category</p>
            <p className="text-sm font-medium text-purple-700">
              {point.kittaComponent} — {KITTA_LABELS[point.kittaComponent as KittaCode]}
            </p>
          </div>
        )}

        {/* Related staff */}
        {point.relatedStaff && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Related Staff</p>
            <p className="text-sm">{point.relatedStaff}</p>
          </div>
        )}

        {/* Screenshot */}
        {point.screenshotUrl && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Screenshot</p>
            <img
              src={point.screenshotUrl}
              alt="Evidence screenshot"
              className="rounded-lg border border-border max-h-80 object-contain w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}
