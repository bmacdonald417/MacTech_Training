"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { NarrationPlayer } from "@/components/training/narration-player"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  X,
} from "lucide-react"

type SlideForViewer = {
  id: string
  notesRichText: string | null
}

type PreviewerInstance = {
  preview: (buffer: ArrayBuffer) => Promise<unknown>
  renderPreSlide: () => void
  renderNextSlide: () => void
  get currentIndex(): number
  get slideCount(): number
  destroy?: () => void
}

interface PptxViewerModalProps {
  orgSlug: string
  sourceFileId: string
  slides: SlideForViewer[]
  canGenerateNarration: boolean
  onComplete: () => void
  isCompleted: boolean
  /** Optional title shown in the modal header */
  title?: string | null
}

export function PptxViewerModal({
  orgSlug,
  sourceFileId,
  slides,
  canGenerateNarration,
  onComplete,
  isCompleted,
  title = "Presentation",
}: PptxViewerModalProps) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const previewerRef = useRef<PreviewerInstance | null>(null)

  const standaloneUrl = useMemo(
    () => `/org/${orgSlug}/slides/view/${sourceFileId}`,
    [orgSlug, sourceFileId]
  )

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

  // Init pptx-preview when modal opens so we get real dimensions.
  useEffect(() => {
    if (!open) return
    if (!containerRef.current || !sourceFileId) return

    let mounted = true
    const el = containerRef.current
    const bufferRef = { current: null as ArrayBuffer | null }
    const sizeRef = { current: { w: 0, h: 0 } }
    let hasInited = false

    // Reset state each open
    setLoaded(false)
    setError(null)
    setCurrentIndex(0)

    function destroyPreviewer() {
      const p = previewerRef.current
      try {
        p?.destroy?.()
      } catch {
        // ignore
      }
      previewerRef.current = null
      if (el) el.innerHTML = ""
    }

    function tryInit() {
      if (hasInited) return
      const buf = bufferRef.current
      if (!buf || !mounted) return
      // Use measured size, or fallback so we still load when modal isn't laid out yet (e.g. Radix animation)
      let { w, h } = sizeRef.current
      if (w <= 0 || h <= 0) {
        w = 960
        h = 540
      }

      hasInited = true
      import("pptx-preview").then(({ init }) => {
        if (!mounted || !el) return
        destroyPreviewer()

        const previewer = init(el, {
          width: w,
          height: h,
          mode: "slide",
        }) as unknown as PreviewerInstance

        previewer.preview(buf).then(() => {
          if (!mounted) return
          previewerRef.current = previewer
          setCurrentIndex(previewer.currentIndex)
          setLoaded(true)
        }).catch((err) => {
          if (!mounted) return
          setError(err instanceof Error ? err.message : "Failed to render presentation")
        })
      })
    }

    const url = `/api/org/${orgSlug}/slides/file/${sourceFileId}`
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load presentation")
        return res.arrayBuffer()
      })
      .then((buf) => {
        if (!mounted) return
        bufferRef.current = buf
        tryInit()
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load")
      })

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry || !mounted) return
      const { width, height } = entry.contentRect
      sizeRef.current = { w: Math.floor(width), h: Math.floor(height) }
      tryInit()
    })
    resizeObserver.observe(el)

    const fallbackTimer = setTimeout(() => {
      if (!mounted || hasInited) return
      const w = el.offsetWidth || 0
      const h = el.offsetHeight || 0
      if (w > 0 && h > 0) {
        sizeRef.current = { w, h }
        tryInit()
      }
    }, 300)

    return () => {
      mounted = false
      clearTimeout(fallbackTimer)
      resizeObserver.disconnect()
      destroyPreviewer()
    }
  }, [open, orgSlug, sourceFileId])

  // Keep currentIndex in sync if the library's built-in nav is used.
  useEffect(() => {
    if (!open || !loaded || slides.length === 0) return
    const maxIndex = Math.max(0, slides.length - 1)
    const id = setInterval(() => {
      const p = previewerRef.current
      if (!p) return
      const libIndex = Math.max(0, Math.min(p.currentIndex, maxIndex))
      setCurrentIndex((i) => (i !== libIndex ? libIndex : i))
    }, 250)
    return () => clearInterval(id)
  }, [open, loaded, slides.length])

  const currentSlide = slides[currentIndex]
  const speakerNotes = currentSlide?.notesRichText?.trim() ?? ""
  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= Math.max(0, slides.length - 1)

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={() => setOpen(true)}
        >
          <Maximize2 className="h-4 w-4" />
          View slides
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => window.open(standaloneUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-4 w-4" />
          New tab
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showClose={false}
          className="p-0 w-[98vw] max-w-none h-[94vh] max-h-none overflow-hidden rounded-2xl border border-border/40 bg-card/95"
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-tight">
                  {title || "Presentation"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Slide {Math.min(currentIndex + 1, slides.length)} of{" "}
                  {slides.length}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={goPrev}
                  disabled={!loaded || isFirst}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={goNext}
                  disabled={!loaded || isLast}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
              {/* Slide area (big, full dimension within modal) */}
              <div className="relative flex min-h-[320px] min-w-0 flex-1 overflow-hidden rounded-2xl border border-border/40 bg-slate-950/40 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                <div
                  ref={containerRef}
                  className="absolute inset-0 min-h-0 min-w-0 overflow-hidden bg-white"
                  style={{ minWidth: 1, minHeight: 1 }}
                />
                {!loaded && !error && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    Loading presentation…
                  </div>
                )}
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="max-w-lg rounded-xl border border-border/40 bg-card p-5">
                      <div className="text-sm font-medium">
                        Couldn&apos;t load the deck
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {error}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes + Play (beneath each slide) */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Speaker notes
                    </div>
                    <div className="text-xs text-muted-foreground">
                      For slide {Math.min(currentIndex + 1, slides.length)}
                    </div>
                  </div>
                  {speakerNotes ? (
                    <div className="max-h-[22vh] overflow-auto pr-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                      {speakerNotes}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No notes for this slide.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Audio
                  </div>
                  <NarrationPlayer
                    orgSlug={orgSlug}
                    entityType="SLIDE"
                    entityId={currentSlide?.id ?? slides[0]?.id ?? ""}
                    canGenerate={canGenerateNarration}
                    showMediaControls
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/40 px-4 py-3">
              <div className="text-xs text-muted-foreground">
                Tip: use the arrow keys inside the slide to navigate.
              </div>
              {!isCompleted ? (
                <Button type="button" onClick={onComplete} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Complete
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

