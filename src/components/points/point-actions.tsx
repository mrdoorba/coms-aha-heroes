import * as React from 'react'
import { Button } from '~/components/ui/button'
import * as m from '~/paraglide/messages'
import { ChallengeDialog } from './challenge-dialog'
import { AppealDialog } from './appeal-dialog'
import { useSession } from '~/lib/auth-client'
import type { PointStatus, PointCategoryCode } from '~/shared/constants'

interface PointActionsProps {
  point: {
    id: string
    userId: string
    submittedBy: string
    status: string
    category: {
      code: string
    }
  }
}

export function PointActions({ point }: PointActionsProps) {
  const { data: session } = useSession()
  const user = session?.user

  if (!user) return null

  const isRecipient = user.id === point.userId
  const isSubmitter = user.id === point.submittedBy
  const isHRorAdmin = user.role === 'hr' || user.role === 'admin'
  const isLeader = user.role === 'leader'
  const isPenalti = point.category.code === 'PENALTI'
  const status = point.status as PointStatus

  const canChallenge = isLeader && !isSubmitter && isPenalti && status === 'active'
  const canAppeal = isRecipient && isPenalti && status === 'active'

  if (!canChallenge && !canAppeal) return null

  return (
    <div className="flex flex-col gap-2 w-full mt-4">
      {canChallenge && (
        <ChallengeDialog
          pointId={point.id}
          trigger={
            <Button className="w-full btn-gradient-purple rounded-xl py-6 text-base font-semibold shadow-lg shadow-purple-900/20">
              {m.point_action_challenge()}
            </Button>
          }
        />
      )}

      {canAppeal && (
        <AppealDialog
          pointId={point.id}
          trigger={
            <Button className="w-full btn-gradient-blue rounded-xl py-6 text-base font-semibold shadow-lg shadow-blue-900/20">
              {m.point_action_appeal()}
            </Button>
          }
        />
      )}
    </div>
  )
}
