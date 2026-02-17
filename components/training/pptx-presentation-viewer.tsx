"use client"

import { useEffect, useRef, useState } from "react"

interface PptxPresentationViewerProps {
  orgSlug: string
  sourceFileId: string
  title?: string
}

export function PptxPresentationViewer({
  orgSlug,
  sourceFileId,
  title = "Presentation",
}: PptxPresentationViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let previewer: { preview: (file: ArrayBuffer) => Promise<unknown>; destroy?: () => void } | null = null

    const run = async () => {
      try {
        const [{ init }, res] = await Promise.all([
          import("pptx-preview").then((m) => ({ init: m.init })),
          fetch(`/api/org/${orgSlug}/slides/file/${sourceFileId}`),
        ])

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || `Failed to load file (${res.status})`)
        }

        const arrayBuffer = await res.arrayBuffer()
        previewer = init(el, { mode: "slide" }) as { preview: (file: ArrayBuffer) => Promise<unknown>; destroy?: () => void }
        await previewer.preview(arrayBuffer)
        setStatus("ready")
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load presentation")
        setStatus("error")
      }
    }

    run()
    return () => {
      if (previewer && typeof previewer.destroy === "function") {
        previewer.destroy()
      }
    }
  }, [orgSlug, sourceFileId])

  if (status === "error") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/30 p-8 text-center">
        <p className="font-medium text-destructive">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      {title && (
        <h1 className="shrink-0 truncate px-1 text-lg font-semibold text-foreground">{title}</h1>
      )}
      <div
        ref={containerRef}
        className="min-h-[360px] flex-1 w-full overflow-auto rounded-xl border border-border/40 bg-white"
      />
      {status === "loading" && (
        <p className="shrink-0 px-1 text-sm text-muted-foreground">Loading presentation…</p>
      )}
    </div>
  )
}
