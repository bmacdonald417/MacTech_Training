"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

type BulkSelectContextValue = {
  selectedIds: Set<string>
  toggle: (id: string) => void
  toggleAll: () => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
  isAllSelected: boolean
  hasSelection: boolean
  count: number
}

const BulkSelectContext = createContext<BulkSelectContextValue | null>(null)

function useBulkSelect() {
  const ctx = useContext(BulkSelectContext)
  if (!ctx) throw new Error("BulkSelectCheckbox or BulkSelectBar must be used inside BulkSelectProvider")
  return ctx
}

export function BulkSelectCheckbox({ id }: { id: string }) {
  const { isSelected, toggle } = useBulkSelect()
  return (
    <input
      type="checkbox"
      checked={isSelected(id)}
      onChange={() => toggle(id)}
      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary/20"
      aria-label={`Select ${id}`}
    />
  )
}

export function BulkSelectHeaderCheckbox() {
  const { isAllSelected, toggleAll, hasSelection } = useBulkSelect()
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = hasSelection && !isAllSelected
  }, [hasSelection, isAllSelected])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={isAllSelected}
      onChange={toggleAll}
      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary/20"
      aria-label="Select all"
    />
  )
}

export function BulkSelectBar({
  onBulkDelete,
  confirmMessage,
  deleteLabel = "Delete selected",
  clearLabel = "Clear",
}: {
  onBulkDelete: (ids: string[]) => Promise<void>
  confirmMessage: string
  deleteLabel?: string
  clearLabel?: string
}) {
  const { selectedIds, count, clearSelection, hasSelection } = useBulkSelect()
  const [pending, setPending] = useState(false)

  const handleClear = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  const handleDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    const msg = confirmMessage.replace(/\{n\}/g, String(ids.length))
    if (!confirm(msg)) return
    setPending(true)
    try {
      await onBulkDelete(ids)
      clearSelection()
    } finally {
      setPending(false)
    }
  }, [selectedIds, onBulkDelete, confirmMessage, clearSelection])

  if (!hasSelection) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-2 text-sm">
      <span className="text-muted-foreground">
        <strong className="text-foreground">{count}</strong> selected
      </span>
      <Button variant="ghost" size="sm" onClick={handleClear} disabled={pending}>
        {clearLabel}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={pending}
        className="gap-1"
      >
        <Trash2 className="h-4 w-4" />
        {deleteLabel}
      </Button>
    </div>
  )
}

export function BulkSelectProvider({
  itemIds,
  children,
}: {
  itemIds: string[]
  children: React.ReactNode
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (itemIds.length === 0) return new Set()
      if (prev.size === itemIds.length) return new Set()
      return new Set(itemIds)
    })
  }, [itemIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  const value = useMemo<BulkSelectContextValue>(
    () => ({
      selectedIds,
      toggle,
      toggleAll,
      clearSelection,
      isSelected,
      isAllSelected: itemIds.length > 0 && selectedIds.size === itemIds.length,
      hasSelection: selectedIds.size > 0,
      count: selectedIds.size,
    }),
    [selectedIds, toggle, toggleAll, clearSelection, isSelected, itemIds.length]
  )

  return (
    <BulkSelectContext.Provider value={value}>
      {children}
    </BulkSelectContext.Provider>
  )
}
