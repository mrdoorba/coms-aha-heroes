import * as React from 'react'
import * as m from '~/paraglide/messages'
import { Badge } from '~/components/ui/badge'
import { ResolveDialog } from './resolve-dialog'
import { useSession } from '~/lib/auth-client'
import { listChallengesFn } from '~/server/functions/challenges'
import { listAppealsFn } from '~/server/functions/appeals'
import { useSuspenseQuery } from '@tanstack/react-query'
import { cn } from '~/lib/utils'
import { Clock, User as UserIcon, CheckCircle2, XCircle } from 'lucide-react'

interface IssueListsProps {
  pointId: string
}

export function ChallengesList({ pointId }: IssueListsProps) {
  const { data: session } = useSession()
  const user = session?.user
  const isHRorAdmin = user?.role === 'hr' || user?.role === 'admin'

  const { data } = useSuspenseQuery({
    queryKey: ['challenges', pointId],
    queryFn: () => listChallengesFn({ data: { pointId } }),
  })

  const challenges = data?.challenges ?? []

  if (challenges.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6D50B8]" />
        {m.issue_challenges()}
      </h3>
      <div className="space-y-3">
        {challenges.map((challenge: any) => (
          <div key={challenge.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={challenge.status} />
                <span className="text-xs text-muted-foreground">
                  {new Date(challenge.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {isHRorAdmin && challenge.status === 'open' && (
                <ResolveDialog type="challenge" id={challenge.id} />
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <UserIcon className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">{challenge.challenger?.name ?? 'Unknown'}</span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed italic bg-muted/30 p-2 rounded-lg">
              "{challenge.reason}"
            </p>

            {challenge.status !== 'open' && challenge.resolutionNote && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
                <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {challenge.status === 'upheld' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {m.issue_resolution()}: {challenge.status}
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {challenge.resolutionNote}
                </p>
                <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {m.issue_resolved_on({ date: new Date(challenge.resolvedAt).toLocaleDateString('id-ID') })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AppealsList({ pointId }: IssueListsProps) {
  const { data: session } = useSession()
  const user = session?.user
  const isHRorAdmin = user?.role === 'hr' || user?.role === 'admin'

  const { data } = useSuspenseQuery({
    queryKey: ['appeals', pointId],
    queryFn: () => listAppealsFn({ data: { pointId } }),
  })

  const appeals = data?.appeals ?? []

  if (appeals.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F4C144]" />
        {m.issue_appeals()}
      </h3>
      <div className="space-y-3">
        {appeals.map((appeal: any) => (
          <div key={appeal.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={appeal.status} />
                <span className="text-xs text-muted-foreground">
                  {new Date(appeal.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {isHRorAdmin && appeal.status === 'open' && (
                <ResolveDialog type="appeal" id={appeal.id} />
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed italic bg-muted/30 p-2 rounded-lg">
              "{appeal.reason}"
            </p>

            {appeal.status !== 'open' && appeal.resolutionNote && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
                <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {appeal.status === 'upheld' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {m.issue_resolution()}: {appeal.status}
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {appeal.resolutionNote}
                </p>
                <div className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {m.issue_resolved_on({ date: new Date(appeal.resolvedAt).toLocaleDateString('id-ID') })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    open: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50",
    upheld: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50",
    overturned: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50",
  }[status as 'open' | 'upheld' | 'overturned'] || "bg-muted text-muted-foreground"

  return (
    <Badge variant="outline" className={cn("rounded-md px-1.5 py-0 text-[10px] font-bold uppercase", colors)}>
      {status}
    </Badge>
  )
}
