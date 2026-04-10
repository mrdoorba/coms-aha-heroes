import { createFileRoute, Link } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
import { ArrowLeft, User } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { CategoryIcon } from '~/components/points/category-icon'
import { StatusBadge } from '~/components/points/status-badge'
import { PointActions } from '~/components/points/point-actions'
import { ChallengesList, AppealsList } from '~/components/points/issue-lists'
import { CommentThread } from '~/components/points/comment-thread'
import { getPointByIdFn } from '~/server/functions/points'
import { KITTA_LABELS } from '~/shared/constants'
import type { PointCategoryCode, PointStatus, KittaCode } from '~/shared/constants'
import { Suspense } from 'react'
import { Skeleton } from '~/components/ui/skeleton'

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
      ? 'text-[#C73E3E]'
      : categoryCode === 'BINTANG'
        ? 'text-[#a07700]'
        : 'text-[#325FEC]'

  const prefix = categoryCode === 'PENALTI' ? '-' : '+'

  return (
    <div className="max-w-2xl mx-auto p-0 min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-md px-4 py-3 border-b border-border flex items-center gap-3">
        <Link to="/points">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/8 hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            <Link to="/points" className="hover:text-primary transition-colors">{m.nav_points()}</Link>
            <span>/</span>
            <span>{m.point_detail_title()}</span>
          </div>
          <h1 className="text-base font-bold text-foreground leading-tight truncate">{m.point_detail_title()}</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Main info card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5 shadow-card">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <CategoryIcon code={categoryCode} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">
                    {point.category?.defaultName ?? categoryCode}
                  </span>
                  <StatusBadge status={point.status as PointStatus} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
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
            <span className={`text-2xl font-black tracking-tight ${pointColor}`}>
              {prefix}{point.points}
            </span>
          </div>

          <div className="grid gap-3">
            {/* Recipient */}
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 border border-border/30">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 shrink-0 border border-primary/5">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{m.point_detail_recipient()}</p>
                <p className="text-sm font-semibold truncate">{point.user?.name ?? m.common_unknown()}</p>
                <p className="text-xs text-muted-foreground truncate">{point.user?.email}</p>
              </div>
            </div>

            {/* Submitted by */}
            {point.submitter && (
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 border border-border/30">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0 border border-border/50">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{m.point_detail_submitted_by()}</p>
                  <p className="text-sm font-semibold truncate">{point.submitter.name}</p>
                  <p className="text-xs text-muted-foreground uppercase">{point.submitter.role}</p>
                </div>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{m.point_detail_reason()}</p>
            <p className="text-sm leading-relaxed text-foreground/90 font-medium">{point.reason}</p>
          </div>

          {/* KITTA (Penalti only) */}
          {categoryCode === 'PENALTI' && point.kittaComponent && (
            <div className="rounded-xl border border-destructive/15 bg-destructive/5 p-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-destructive mb-1">{m.point_detail_kitta_category()}</p>
              <p className="text-sm font-semibold text-foreground">
                {point.kittaComponent} — {KITTA_LABELS[point.kittaComponent as KittaCode]}
              </p>
            </div>
          )}

          {/* Related staff */}
          {point.relatedStaff && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{m.point_detail_related_staff()}</p>
              <p className="text-sm font-medium">{point.relatedStaff}</p>
            </div>
          )}

          {/* Screenshot */}
          {point.screenshotUrl && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{m.point_detail_evidence()}</p>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border group">
                <img
                  src={point.screenshotUrl}
                  alt={m.point_detail_evidence()}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          )}
        </div>

        {/* Challenges & Appeals Section */}
        <div className="space-y-8">
          <Suspense fallback={<ListSkeleton />}>
            <ChallengesList pointId={point.id} />
          </Suspense>

          <Suspense fallback={<ListSkeleton />}>
            <AppealsList pointId={point.id} />
          </Suspense>

          <div className="h-px bg-border/50" />

          <Suspense fallback={<ListSkeleton />}>
            <CommentThread entityId={point.id} entityType="achievement" />
          </Suspense>
        </div>
      </div>

      {/* Sticky Action Buttons at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] max-w-2xl mx-auto z-20">
        <PointActions point={point} />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-24 rounded" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  )
}
