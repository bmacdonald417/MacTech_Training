"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { NarrationPlayer } from "./narration-player"

/**
 * Custom embedded PPTX viewer strategy:
 * - Render once at a fixed base resolution (crisp + predictable DOM from `pptx-preview`)
 * - Scale the rendered output with CSS to fit the available viewport while preserving aspect ratio
 * This avoids truncation/overflow quirks that can happen when re-initializing the previewer at
 * varying sizes.
 */
const PPTX_BASE_WIDTH = 1280
const PPTX_BASE_HEIGHT = 720

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
  renderSingleSlide: (slideIndex: number) => void
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
  const viewportRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previewerRef = useRef<PreviewerInstance | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scale, setScale] = useState(1)

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
    if (!containerRef.current || !viewportRef.current || !sourceFileId) return
    let mounted = true
    const el = containerRef.current
    const viewportEl = viewportRef.current
    const bufferRef = { current: null as ArrayBuffer | null }
    let hasInited = false

    function tryInit() {
      if (hasInited) return
      const buf = bufferRef.current
      if (!buf || !mounted) return
      hasInited = true
      import("pptx-preview").then(({ init }) => {
        if (!mounted || !el) return
        // Clear any previous render output if this effect reruns.
        el.innerHTML = ""
        previewerRef.current = null
        const previewer = init(el, {
          width: PPTX_BASE_WIDTH,
          height: PPTX_BASE_HEIGHT,
          mode: "slide",
        }) as unknown as PreviewerInstance
        previewer.preview(buf).then(() => {
          if (!mounted) return
          previewerRef.current = previewer
          setCurrentIndex(previewer.currentIndex)
          setLoaded(true)
          const forceRender = () => {
            if (typeof previewer.renderSingleSlide === "function") {
              previewer.renderSingleSlide(0)
            }
          }
          forceRender()
          requestAnimationFrame(forceRender)
          setTimeout(forceRender, 100)
          setTimeout(forceRender, 400)
        })
      })
    }

    // Reset state when switching decks.
    setLoaded(false)
    setError(null)
    setCurrentIndex(0)

    const url = `/api/org/${orgSlug}/slides/file/${sourceFileId}`
    fetch(url, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (res.status === 404 && body?.code === "FILE_MISSING_ON_DISK") {
            throw new Error("FILE_MISSING_ON_DISK")
          }
          throw new Error("Failed to load presentation")
        }
        return res.arrayBuffer()
      })
      .then((buf) => {
        if (mounted) {
          bufferRef.current = buf
          setTimeout(() => tryInit(), 100)
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(
            e instanceof Error && e.message === "FILE_MISSING_ON_DISK"
              ? "Presentation file is missing on the server. Re-upload the deck from Admin → Presentations."
              : e instanceof Error
                ? e.message
                : "Failed to load"
          )
        }
      })

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry || !mounted) return
      const { width, height } = entry.contentRect
      const availW = Math.floor(width)
      const availH = Math.floor(height)
      if (availW <= 0 || availH <= 0) return

      const nextScale = Math.min(
        1,
        Math.max(0.05, Math.min(availW / PPTX_BASE_WIDTH, availH / PPTX_BASE_HEIGHT)),
      )
      setScale((prev) => (Math.abs(prev - nextScale) < 0.001 ? prev : nextScale))
    })
    resizeObserver.observe(viewportEl)

    // Kick init as soon as we have the buffer; scaling is handled separately via CSS.
    const fallbackTimer = setTimeout(() => {
      if (!mounted) return
      tryInit()
    }, 400)

    return () => {
      mounted = false
      clearTimeout(fallbackTimer)
      resizeObserver.disconnect()
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
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      {/* Slide area: majority of space so slide is large and visible */}
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-border/40 bg-slate-900/50">
        <div
          ref={viewportRef}
          className="absolute inset-0 flex min-h-0 min-w-0 items-center justify-center overflow-hidden"
        >
          <div
            className="shrink-0 overflow-hidden bg-white"
            style={{
              width: Math.round(PPTX_BASE_WIDTH * scale),
              height: Math.round(PPTX_BASE_HEIGHT * scale),
            }}
          />
          <div
            ref={containerRef}
            className="absolute left-1/2 top-1/2 overflow-hidden bg-white"
            style={{
              width: PPTX_BASE_WIDTH,
              height: PPTX_BASE_HEIGHT,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        </div>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-900/50 rounded-xl">
            Loading presentation…
          </div>
        )}
      </div>

      {/* Controls: Previous | Next | counter */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/40 pb-1">
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

      {/* Speaker notes + narrator: no scrolling; slide shrinks to fit notes */}
      <div className="flex shrink-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide shrink-0">Speaker notes</div>
        {speakerNotes ? (
          <p className="text-xs text-foreground whitespace-pre-wrap leading-snug break-words">
            {speakerNotes}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">No notes for this slide.</p>
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
      <div className="flex shrink-0 items-center justify-between border-t border-border/40 pt-1">
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

