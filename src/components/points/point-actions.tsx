import * as React from 'react'
import { Button } from '~/components/ui/button'
import { ChallengeDialog } from './challenge-dialog'
import { AppealDialog } from './appeal-dialog'
import { ResolveDialog } from './resolve-dialog'
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

  // Action buttons visibility logic
  const canChallenge = isLeader && !isSubmitter && isPenalti && status === 'active'
  const canAppeal = isRecipient && isPenalti && status === 'active'
  
  // Resolve buttons are shown if there are open challenges/appeals
  // But for the detail page, we might just show them if status is 'challenged' or 'frozen'
  const canResolve = isHRorAdmin && (status === 'challenged' || status === 'frozen')

  if (!canChallenge && !canAppeal && !canResolve) return null

  return (
    <div className="flex flex-col gap-2 w-full mt-4">
      {canChallenge && (
        <ChallengeDialog 
          pointId={point.id} 
          trigger={
            <Button className="w-full bg-[#6D50B8] hover:bg-purple-700 rounded-xl py-6 text-base font-semibold shadow-lg shadow-purple-200">
              Challenge This Penalti
            </Button>
          }
        />
      )}
      
      {canAppeal && (
        <AppealDialog 
          pointId={point.id} 
          trigger={
            <Button className="w-full bg-[#325FEC] hover:bg-blue-700 rounded-xl py-6 text-base font-semibold shadow-lg shadow-blue-200">
              Appeal This Penalti
            </Button>
          }
        />
      )}

      {/* Resolve buttons for HR/Admin are usually per challenge/appeal, 
          but we can show a general resolve button that opens a list or the most recent one */}
    </div>
  )
}
