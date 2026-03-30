import { useState, useCallback, useMemo } from 'react'

export function useBulkSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        for (const id of ids) next.delete(id)
        return next
      }
      return new Set([...prev, ...ids])
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isAllSelected = useCallback(
    (ids: string[]) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    [selectedIds],
  )

  const selectedCount = selectedIds.size

  return useMemo(
    () => ({ selectedIds, selectedCount, toggleId, toggleAll, clearSelection, isAllSelected }),
    [selectedIds, selectedCount, toggleId, toggleAll, clearSelection, isAllSelected],
  )
}
