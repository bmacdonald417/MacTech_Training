"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { NarrationPlayer } from "./narration-player"

interface PptxFullViewerProps {
  orgSlug: string
  sourceFileId: string
  slideCount: number
  firstSlideId: string
  canGenerateNarration?: boolean
  onComplete: () => void
  isCompleted: boolean
}

export function PptxFullViewer({
  orgSlug,
  sourceFileId,
  slideCount,
  firstSlideId,
  canGenerateNarration = false,
  onComplete,
  isCompleted,
}: PptxFullViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || !sourceFileId) return
    let mounted = true
    const url = `/api/org/${orgSlug}/slides/file/${sourceFileId}`
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load presentation")
        return res.arrayBuffer()
      })
      .then((buffer) => {
        if (!mounted || !containerRef.current) return
        return import("pptx-preview").then(({ init }) => {
          if (!mounted || !containerRef.current) return
          const previewer = init(containerRef.current, {
            width: 960,
            height: 540,
            mode: "slide",
          })
          return previewer.preview(buffer).then(() => {
            if (mounted) setLoaded(true)
          })
        })
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load")
      })
    return () => {
      mounted = false
    }
  }, [orgSlug, sourceFileId])

  if (error) {
    return (
      <div className="rounded-xl bg-slate-900/80 px-6 py-8 text-slate-200">
        <p className="text-destructive">{error}</p>
        <p className="mt-2 text-sm text-slate-400">
          The presentation could not be loaded. Try downloading it instead.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border/40 bg-slate-900/50">
        <div
          ref={containerRef}
          className="min-h-[360px] w-full bg-white"
          style={{ aspectRatio: "960/540" }}
        />
        {!loaded && (
          <div className="flex min-h-[360px] items-center justify-center text-slate-400">
            Loading presentation…
          </div>
        )}
      </div>

      <NarrationPlayer
        orgSlug={orgSlug}
        entityType="SLIDE"
        entityId={firstSlideId}
        canGenerate={canGenerateNarration}
      />

      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <span className="text-sm text-slate-400">
          {slideCount} slide{slideCount === 1 ? "" : "s"}
        </span>
        {!isCompleted ? (
          <Button onClick={onComplete}>
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Completed</span>
          </div>
        )}
      </div>
    </div>
  )
}
