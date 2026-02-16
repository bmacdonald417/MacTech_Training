"use client"

import { useEffect, useState } from "react"
import { SlideShowViewer } from "@/components/training/slide-show-viewer"

interface SlideShowPageClientProps {
  orgSlug: string
  sourceFileId: string
  title: string
  initialSlideCount: number | null
  /** Ordered slide entity IDs for narration (from deck). */
  initialSlideIds?: string[] | null
}

type LoadState = "loading" | "ready" | "error" | "empty"

function friendlyMessage(code?: string, serverMessage?: string): string {
  if (code === "FILE_TOO_LARGE") {
    return "This presentation is too large for in-browser slide generation (over the allowed size limit)."
  }
  if (code === "CONVERSION_OOM") {
    return "The server couldn’t generate slides for this file (out of memory)."
  }
  if (code === "STORAGE_NOT_WRITABLE") {
    return "Slide generation is not available (storage not configured)."
  }
  if (serverMessage) return serverMessage
  return "Slides could not be generated for this presentation."
}

export function SlideShowPageClient({
  orgSlug,
  sourceFileId,
  title,
  initialSlideCount,
  initialSlideIds = null,
}: SlideShowPageClientProps) {
  const [count, setCount] = useState<number | null>(initialSlideCount)
  const [loadState, setLoadState] = useState<LoadState>(
    initialSlideCount !== null ? "ready" : "loading"
  )
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    if (count != null || loadState !== "loading") return
    const url = `/api/org/${orgSlug}/slides/slide-image/${sourceFileId}/count`
    fetch(url, { credentials: "include" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (r.ok && typeof data.count === "number") {
          setCount(data.count)
          setLoadState(data.count === 0 ? "empty" : "ready")
        } else {
          const msg = friendlyMessage(data?.code, data?.error)
          setErrorMessage(msg)
          setLoadState("error")
        }
      })
      .catch(() => {
        setErrorMessage("Could not load the presentation. Try again or download the file.")
        setLoadState("error")
      })
  }, [orgSlug, sourceFileId, count, loadState])

  const downloadUrl = `/api/org/${orgSlug}/slides/file/${sourceFileId}`

  if (loadState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-6">
        <div className="text-center max-w-md">
          <p className="text-slate-200">{errorMessage}</p>
          <a
            href={downloadUrl}
            download
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
          >
            Download presentation instead
          </a>
        </div>
      </div>
    )
  }

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

  if (count === 0 || loadState === "empty") {
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
        slideIds={initialSlideIds ?? undefined}
        embedded={false}
      />
    </div>
  )
}
