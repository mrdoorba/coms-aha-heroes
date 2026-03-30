import { useState } from 'react'
import { X } from 'lucide-react'
import * as m from '~/paraglide/messages'

type BulkAction = {
  readonly label: string
  readonly variant: 'default' | 'destructive'
  readonly onClick: () => void | Promise<void>
  readonly requiresReason?: boolean
}

type BulkActionBarProps = {
  readonly selectedCount: number
  readonly actions: readonly BulkAction[]
  readonly onClear: () => void
}

export function BulkActionBar({ selectedCount, actions, onClear }: BulkActionBarProps) {
  const [confirming, setConfirming] = useState<BulkAction | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (selectedCount === 0) return null

  async function handleConfirm() {
    if (!confirming) return
    setLoading(true)
    try {
      await confirming.onClick()
    } finally {
      setLoading(false)
      setConfirming(null)
      setReason('')
    }
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
        <span className="text-sm font-medium text-gray-700">
          {m.bulk_selected_count({ count: selectedCount })}
        </span>

        <div className="h-5 w-px bg-gray-200" />

        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => setConfirming(action)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              action.variant === 'destructive'
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-[#325FEC] text-white hover:bg-[#2850d0]'
            }`}
          >
            {action.label}
          </button>
        ))}

        <button
          type="button"
          onClick={onClear}
          className="ml-1 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label={m.bulk_deselect_all()}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {m.bulk_confirm_title()}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {m.bulk_confirm_message({ action: confirming.label, count: selectedCount })}
            </p>

            {confirming.requiresReason && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  {m.bulk_rejection_reason_label()}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#325FEC] focus:outline-none focus:ring-1 focus:ring-[#325FEC]"
                />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setConfirming(null); setReason('') }}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {m.common_cancel()}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || (confirming.requiresReason && !reason.trim())}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  confirming.variant === 'destructive'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#325FEC] hover:bg-[#2850d0]'
                }`}
              >
                {loading ? m.common_loading() : m.common_confirm()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
