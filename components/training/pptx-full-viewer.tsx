"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { NarrationPlayer } from "./narration-player"

interface SlideForViewer {
  id: string
  notesRichText: string | null
}

interface PptxFullViewerProps {
  orgSlug: string
  sourceFileId: string
  slides: SlideForViewer[]
  canGenerateNarration?: boolean
  onComplete: () => void
  isCompleted: boolean
}

type PreviewerInstance = {
  preview: (buffer: ArrayBuffer) => Promise<unknown>
  renderPreSlide: () => void
  renderNextSlide: () => void
  get currentIndex(): number
  get slideCount(): number
}

export function PptxFullViewer({
  orgSlug,
  sourceFileId,
  slides,
  canGenerateNarration = false,
  onComplete,
  isCompleted,
}: PptxFullViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previewerRef = useRef<PreviewerInstance | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const goPrev = useCallback(() => {
    const p = previewerRef.current
    if (!p || p.currentIndex <= 0) return
    p.renderPreSlide()
    requestAnimationFrame(() => setCurrentIndex(p.currentIndex))
  }, [])

  const goNext = useCallback(() => {
    const p = previewerRef.current
    if (!p || p.currentIndex >= p.slideCount - 1) return
    p.renderNextSlide()
    requestAnimationFrame(() => setCurrentIndex(p.currentIndex))
  }, [])

  useEffect(() => {
    if (!containerRef.current || !sourceFileId) return
    let mounted = true
    const el = containerRef.current

    function run() {
      if (!mounted || !el) return
      const width = el.offsetWidth || 960
      const height = Math.round((width * 540) / 960)

      const url = `/api/org/${orgSlug}/slides/file/${sourceFileId}`
      fetch(url, { credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load presentation")
          return res.arrayBuffer()
        })
        .then((buffer) => {
          if (!mounted || !el) return
          return import("pptx-preview").then(({ init }) => {
            if (!mounted || !el) return
            const previewer = init(el, {
              width,
              height,
              mode: "slide",
            }) as unknown as PreviewerInstance
            return previewer.preview(buffer).then(() => {
              if (!mounted) return
              previewerRef.current = previewer
              setCurrentIndex(previewer.currentIndex)
              setLoaded(true)
            })
          })
        })
        .catch((e) => {
          if (mounted) setError(e instanceof Error ? e.message : "Failed to load")
        })
    }
    requestAnimationFrame(run)
    return () => {
      mounted = false
      previewerRef.current = null
    }
  }, [orgSlug, sourceFileId])

  // Sync currentIndex from the library when user uses its built-in prev/next (e.g. arrows in the slide area).
  // Clamp to our slides array so speaker notes and narration always match the visible slide.
  useEffect(() => {
    if (!loaded || slides.length === 0) return
    const maxIndex = Math.max(0, slides.length - 1)
    const id = setInterval(() => {
      const p = previewerRef.current
      if (p == null) return
      const libIndex = Math.max(0, Math.min(p.currentIndex, maxIndex))
      setCurrentIndex((i) => (i !== libIndex ? libIndex : i))
    }, 400)
    return () => clearInterval(id)
  }, [loaded, slides.length])

  const currentSlide = slides[currentIndex]
  const speakerNotes = currentSlide?.notesRichText?.trim() ?? ""
  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= Math.max(0, slides.length - 1)

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
    <div className="flex flex-col gap-4">
      {/* Slide area: fill available width and height; 16:9 aspect ratio */}
      <div
        className="relative w-full overflow-hidden rounded-xl border border-border/40 bg-slate-900/50 flex items-center justify-center"
        style={{ aspectRatio: "960/540", minHeight: 320 }}
      >
        <div
          ref={containerRef}
          className="w-full h-full min-w-0 min-h-0 bg-white flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: "960/540" }}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-900/50 rounded-xl">
            Loading presentation…
          </div>
        )}
      </div>

      {/* Controls: Previous | Next | counter | Play | Pause | Mute | Volume */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goPrev}
          disabled={!loaded || isFirst}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goNext}
          disabled={!loaded || isLast}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          {currentIndex + 1} / {slides.length}
        </span>
      </div>

      {/* Narration bar: speaker notes + narration player */}
      <div className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-3">
        <div className="text-sm font-medium text-muted-foreground">Speaker notes</div>
        {speakerNotes ? (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {speakerNotes}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No notes for this slide.</p>
        )}
        <NarrationPlayer
          orgSlug={orgSlug}
          entityType="SLIDE"
          entityId={currentSlide?.id ?? slides[0]?.id ?? ""}
          canGenerate={canGenerateNarration}
          showMediaControls
        />
      </div>

      {/* Complete */}
      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <span className="text-sm text-slate-400">
          {slides.length} slide{slides.length === 1 ? "" : "s"}
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

