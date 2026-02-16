"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  Minimize2,
  CheckCircle2,
} from "lucide-react"

interface SlideShowViewerProps {
  orgSlug: string
  sourceFileId: string
  slideCount: number
  title: string
  downloadUrl: string
  onComplete?: () => void
  isCompleted?: boolean
  /** When true, viewer fills available space with minimal chrome (embedded in training). When false, assume full-page presentation mode. */
  embedded?: boolean
}

const SWIPE_THRESHOLD_PX = 50
const REDUCED_MOTION_MS = 0
const DEFAULT_TRANSITION_MS = 280

/**
 * In-browser slide show: one slide per view, keyboard/touch/fullscreen.
 * Uses existing slide-image API (PNG per slide). Safari & Chrome friendly.
 */
export function SlideShowViewer({
  orgSlug,
  sourceFileId,
  slideCount,
  title,
  downloadUrl,
  onComplete,
  isCompleted = false,
  embedded = true,
}: SlideShowViewerProps) {
  const [index, setIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  const imageBase = `/api/org/${orgSlug}/slides/slide-image/${sourceFileId}`
  const transitionMs =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? REDUCED_MOTION_MS
      : DEFAULT_TRANSITION_MS

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.max(0, Math.min(slideCount - 1, i + delta)))
      setImageError(false)
    },
    [slideCount]
  )
  const goPrev = useCallback(() => go(-1), [go])
  const goNext = useCallback(() => go(1), [go])

  // Keyboard: ArrowLeft, ArrowRight, Home, End, Escape (exit fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        }
        return
      }
      const target = e.target as HTMLElement
      if (target.closest("input") || target.closest("textarea") || target.closest("[contenteditable]")) return
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          goPrev()
          break
        case "ArrowRight":
        case " ":
          e.preventDefault()
          goNext()
          break
        case "Home":
          e.preventDefault()
          setIndex(0)
          setImageError(false)
          break
        case "End":
          e.preventDefault()
          setIndex(Math.max(0, slideCount - 1))
          setImageError(false)
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goPrev, goNext, slideCount])

  // Fullscreen change (Safari uses webkit prefix)
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    document.addEventListener("webkitfullscreenchange", onFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange)
    }
  }, [])

  const requestFullscreen = useCallback(() => {
    const el = containerRef.current ?? document.documentElement
    const doc = document.documentElement as Document & { webkitRequestFullscreen?: () => Promise<void> }
    if (el.requestFullscreen) {
      el.requestFullscreen()
    } else if (doc.webkitRequestFullscreen) {
      doc.webkitRequestFullscreen()
    }
  }, [])

  const exitFullscreen = useCallback(() => {
    const doc = document as Document & { webkitExitFullscreen?: () => void }
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen()
    }
  }, [])

  // Touch swipe
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }, [])
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const x = touchStartX.current
      touchStartX.current = null
      if (x == null) return
      const endX = e.changedTouches[0].clientX
      const delta = x - endX
      if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
        if (delta > 0) goNext()
        else goPrev()
      }
    },
    [goNext, goPrev]
  )

  // Preload adjacent slides
  useEffect(() => {
    const preload = (i: number) => {
      if (i < 0 || i >= slideCount) return
      const img = new window.Image()
      img.src = `${imageBase}/${i}`
    }
    preload(index - 1)
    preload(index + 1)
  }, [imageBase, index, slideCount])

  const isFirst = index === 0
  const isLast = index === slideCount - 1

  if (slideCount === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl bg-slate-900/80 text-slate-400">
        No slides available.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-black"
      style={embedded ? { minHeight: 0, flex: 1 } : { minHeight: "100vh" }}
      role="region"
      aria-label={`Presentation: ${title}. Slide ${index + 1} of ${slideCount}. Use arrow keys or swipe to navigate.`}
    >
      {/* Slide stage */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <figure
          className="flex h-full w-full items-center justify-center p-2 sm:p-4"
          style={{ transition: transitionMs ? `opacity ${transitionMs}ms ease` : undefined }}
        >
          <img
            key={index}
            src={`${imageBase}/${index}`}
            alt={`Slide ${index + 1} of ${slideCount}`}
            className="max-h-full w-auto max-w-full object-contain select-none"
            draggable={false}
            onError={() => setImageError(true)}
            fetchPriority={index === 0 ? "high" : "auto"}
          />
        </figure>

        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-slate-300">
            <p>Slide could not be loaded. Try downloading the presentation instead.</p>
          </div>
        )}

        {/* Prev/Next hit areas: click left/right edge to navigate (Safari/Chrome friendly) */}
        {slideCount > 1 && (
          <>
            <button
              type="button"
              className="absolute left-0 top-0 bottom-0 w-20 sm:w-24 opacity-0 hover:opacity-100 focus:opacity-100 focus:outline-none cursor-default"
              onClick={goPrev}
              disabled={isFirst}
              aria-label="Previous slide"
            />
            <button
              type="button"
              className="absolute right-0 top-0 bottom-0 w-20 sm:w-24 opacity-0 hover:opacity-100 focus:opacity-100 focus:outline-none cursor-default"
              onClick={goNext}
              disabled={isLast}
              aria-label="Next slide"
            />
          </>
        )}
      </div>

      {/* Chrome: progress, nav, fullscreen, download, complete */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-950/95 px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/15"
            onClick={goPrev}
            disabled={isFirst}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span
            className="min-w-[4rem] text-center text-sm tabular-nums text-white/80"
            aria-live="polite"
          >
            {index + 1} / {slideCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/15"
            onClick={goNext}
            disabled={isLast}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {isFullscreen ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/15"
              onClick={exitFullscreen}
              aria-label="Exit fullscreen"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/15"
              onClick={requestFullscreen}
              aria-label="Enter fullscreen"
            >
              <Expand className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <a
              href={downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="gap-1.5 text-white hover:bg-white/15"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </Button>
          {onComplete != null && (
            isCompleted ? (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </span>
            ) : isLast ? (
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={onComplete}
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark complete
              </Button>
            ) : null
          )}
        </div>
      </div>
    </div>
  )
}
