"use client"

import { useEffect, useState } from "react"
import { SlideShowViewer } from "./slide-show-viewer"

interface TrainingSlideShowViewerProps {
  orgSlug: string
  sourceFileId: string
  title: string
  /** Ordered slide IDs for narration. */
  slideIds?: string[]
  onComplete: () => void
  isCompleted: boolean
}

/**
 * Wrapper for My Training: fetches slide-image count then renders SlideShowViewer (embedded).
 * Uses same server-rendered slide images as Admin > Presentations.
 */
export function TrainingSlideShowViewer({
  orgSlug,
  sourceFileId,
  title,
  slideIds,
  onComplete,
  isCompleted,
}: TrainingSlideShowViewerProps) {
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = `/api/org/${orgSlug}/slides/slide-image/${sourceFileId}/count`
    fetch(url, { credentials: "include" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (r.ok && typeof data.count === "number") {
          setCount(data.count)
          if (data.count === 0) setError("No slides could be generated.")
        } else {
          setError(data?.error ?? "Could not load slides. Try again later.")
        }
      })
      .catch(() => setError("Could not load slides. Try again later."))
  }, [orgSlug, sourceFileId])

  if (error) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-slate-900/80 px-6 py-8 text-center text-slate-200">
        <p>{error}</p>
        <p className="mt-2 text-sm text-slate-400">First load may take a moment while slides are generated.</p>
      </div>
    )
  }

  if (count === null) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-slate-900/80 px-6 py-8 text-slate-300">
        <p>Loading slides…</p>
        <p className="mt-2 text-sm text-slate-400">Generating slide images…</p>
      </div>
    )
  }

  if (count === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-slate-900/80 px-6 py-8 text-slate-300">
        <p>No slides available for this presentation.</p>
      </div>
    )
  }

  return (
    <SlideShowViewer
      orgSlug={orgSlug}
      sourceFileId={sourceFileId}
      slideCount={count}
      title={title}
      slideIds={slideIds}
      onComplete={onComplete}
      isCompleted={isCompleted}
      embedded={true}
    />
  )
}
