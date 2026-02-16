"use client"

import { useEffect, useState } from "react"
import { SlideShowViewer } from "@/components/training/slide-show-viewer"

interface SlideShowPageClientProps {
  orgSlug: string
  sourceFileId: string
  title: string
  initialSlideCount: number | null
}

export function SlideShowPageClient({
  orgSlug,
  sourceFileId,
  title,
  initialSlideCount,
}: SlideShowPageClientProps) {
  const [count, setCount] = useState<number | null>(initialSlideCount)

  useEffect(() => {
    if (count != null) return
    const url = `/api/org/${orgSlug}/slides/slide-image/${sourceFileId}/count`
    fetch(url, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && typeof data.count === "number" && setCount(data.count))
      .catch(() => {})
  }, [orgSlug, sourceFileId, count])

  const downloadUrl = `/api/org/${orgSlug}/slides/file/${sourceFileId}`

  if (count === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-slate-400">Loading presentation…</p>
          <p className="mt-2 text-sm text-slate-500">
            First load may take a moment while slides are generated.
          </p>
        </div>
      </div>
    )
  }

  if (count === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center text-slate-400">
          <p>No slides could be generated for this presentation.</p>
          <a
            href={downloadUrl}
            download
            className="mt-4 inline-block text-primary underline"
          >
            Download file instead
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <SlideShowViewer
        orgSlug={orgSlug}
        sourceFileId={sourceFileId}
        slideCount={count}
        title={title}
        downloadUrl={downloadUrl}
        embedded={false}
      />
    </div>
  )
}
