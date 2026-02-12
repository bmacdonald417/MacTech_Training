"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

type PreviewerInstance = {
  preview: (buffer: ArrayBuffer) => Promise<unknown>
  renderPreSlide: () => void
  renderNextSlide: () => void
  get currentIndex(): number
  get slideCount(): number
}

interface PptxStandaloneViewerProps {
  orgSlug: string
  sourceFileId: string
  filename?: string | null
}

/** Compute slide box size to fit viewport; use 16:9 so slide is never larger than screen. */
function fitBoxInViewport(vw: number, vh: number): { w: number; h: number } {
  if (vw <= 0 || vh <= 0) return { w: 0, h: 0 }
  const w = Math.min(vw, Math.floor(vh * (16 / 9)))
  const h = Math.min(vh, Math.floor(vw * (9 / 16)))
  return { w, h }
}

export function PptxStandaloneViewer({
  orgSlug,
  sourceFileId,
  filename = null,
}: PptxStandaloneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previewerRef = useRef<PreviewerInstance | null>(null)

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideCount, setSlideCount] = useState<number | null>(null)
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const update = () =>
      setBoxSize(fitBoxInViewport(window.innerWidth, window.innerHeight))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

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
    if (!containerRef.current || !sourceFileId || boxSize.w <= 0 || boxSize.h <= 0)
      return

    let mounted = true
    const el = containerRef.current
    const bufferRef = { current: null as ArrayBuffer | null }
    let hasInited = false
    const { w, h } = boxSize

    function tryInit() {
      if (hasInited) return
      const buf = bufferRef.current
      if (!buf || !mounted) return

      hasInited = true
      import("pptx-preview").then(({ init }) => {
        if (!mounted || !el) return
        previewerRef.current = null

        const previewer = init(el, {
          width: w,
          height: h,
          mode: "slide",
        }) as unknown as PreviewerInstance

        previewer.preview(buf).then(() => {
          if (!mounted) return
          previewerRef.current = previewer
          setCurrentIndex(previewer.currentIndex)
          setSlideCount(previewer.slideCount)
          setLoaded(true)
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

    return () => {
      mounted = false
      previewerRef.current = null
    }
  }, [orgSlug, sourceFileId, boxSize.w, boxSize.h])

  // Sync currentIndex from the library if user uses built-in nav.
  useEffect(() => {
    if (!loaded) return
    const id = setInterval(() => {
      const p = previewerRef.current
      if (!p) return
      setCurrentIndex((i) => (i !== p.currentIndex ? p.currentIndex : i))
      setSlideCount((c) => (c !== p.slideCount ? p.slideCount : c))
    }, 300)
    return () => clearInterval(id)
  }, [loaded])

  const isFirst = currentIndex <= 0
  const isLast =
    slideCount == null ? false : currentIndex >= Math.max(0, slideCount - 1)

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
        <div className="max-w-lg rounded-xl border border-border/40 bg-card p-6 text-card-foreground">
          <div className="text-sm font-medium">Couldn&apos;t load the deck</div>
          <div className="mt-2 text-sm text-muted-foreground">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black flex items-center justify-center">
      {/* Slide surface: box fits in viewport (16:9), no scroll */}
      <div
        className="overflow-hidden bg-white shrink-0"
        ref={containerRef}
        style={{
          width: boxSize.w,
          height: boxSize.h,
        }}
      />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
          Loading presentation…
        </div>
      )}

      {/* Minimal overlay controls (non-scrolling) */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-lg bg-black/55 px-2 py-1 text-xs text-white backdrop-blur">
          <span className="truncate">
            {filename?.trim() ? filename : "Presentation"}
          </span>
          {slideCount != null && (
            <span className="shrink-0 text-white/80">
              {currentIndex + 1}/{slideCount}
            </span>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1 rounded-lg bg-black/55 p-1 backdrop-blur">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-white hover:bg-white/15"
            onClick={goPrev}
            disabled={!loaded || isFirst}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-white hover:bg-white/15"
            onClick={goNext}
            disabled={!loaded || isLast}
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-6 w-px bg-white/20" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-white hover:bg-white/15"
            onClick={() => window.close()}
            aria-label="Close"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

