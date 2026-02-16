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
  Play,
  Pause,
} from "lucide-react"

interface SlideShowViewerProps {
  orgSlug: string
  sourceFileId: string
  slideCount: number
  title: string
  downloadUrl: string
  /** Ordered slide entity IDs for narration (TTS). When provided, Play/Pause auto-advance with audio. */
  slideIds?: string[]
  onComplete?: () => void
  isCompleted?: boolean
  /** When true, viewer fills available space with minimal chrome (embedded in training). When false, assume full-page presentation mode. */
  embedded?: boolean
}

const SWIPE_THRESHOLD_PX = 50
const REDUCED_MOTION_MS = 0
const DEFAULT_TRANSITION_MS = 280
/** Delay (ms) before narration starts for a slide */
const PRE_AUDIO_DELAY_MS = 800
/** Delay (ms) after narration ends before advancing to next slide */
const POST_AUDIO_DELAY_MS = 600

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
  slideIds,
  onComplete,
  isCompleted = false,
  embedded = true,
}: SlideShowViewerProps) {
  const [index, setIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const narrationAudioRef = useRef<HTMLAudioElement>(null)
  const isAutoPlayingRef = useRef(false)
  const pendingTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const canAutoPlayNarration = Boolean(slideIds?.length)

  const imageBase = `/api/org/${orgSlug}/slides/slide-image/${sourceFileId}`
  const transitionMs =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? REDUCED_MOTION_MS
      : DEFAULT_TRANSITION_MS

  const clearPendingTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach((id) => clearTimeout(id))
    pendingTimeoutsRef.current = []
  }, [])

  const go = useCallback(
    (delta: number) => {
      if (isAutoPlayingRef.current) {
        isAutoPlayingRef.current = false
        setIsAutoPlaying(false)
        clearPendingTimeouts()
        narrationAudioRef.current?.pause()
      }
      setIndex((i) => Math.max(0, Math.min(slideCount - 1, i + delta)))
      setImageError(false)
    },
    [slideCount, clearPendingTimeouts]
  )
  const goPrev = useCallback(() => go(-1), [go])
  const goNext = useCallback(() => go(1), [go])

  const runStep = useCallback(
    (slideIndex: number) => {
      if (!isAutoPlayingRef.current || slideIndex >= slideCount) {
        setIsAutoPlaying(false)
        isAutoPlayingRef.current = false
        return
      }
      const t1 = setTimeout(() => {
        pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== t1)
        if (!isAutoPlayingRef.current) return
        const entityId = slideIds?.[slideIndex]
        if (!entityId) {
          const t2 = setTimeout(() => {
            pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== t2)
            if (!isAutoPlayingRef.current) return
            setIndex(slideIndex + 1)
            if (slideIndex + 1 < slideCount) runStep(slideIndex + 1)
            else {
              setIsAutoPlaying(false)
              isAutoPlayingRef.current = false
            }
          }, POST_AUDIO_DELAY_MS)
          pendingTimeoutsRef.current.push(t2)
          return
        }
        fetch(
          `/api/org/${orgSlug}/narration?entityType=SLIDE&entityId=${encodeURIComponent(entityId)}`
        )
          .then((r) => r.json().catch(() => ({})))
          .then((data: { hasNarration?: boolean; streamUrl?: string }) => {
            if (!isAutoPlayingRef.current) return
            const audio = narrationAudioRef.current
            if (data.hasNarration && data.streamUrl && audio) {
              audio.src = data.streamUrl
              audio.load()
              const onEnded = () => {
                audio.removeEventListener("ended", onEnded)
                if (!isAutoPlayingRef.current) return
                const t2 = setTimeout(() => {
                  pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== t2)
                  if (!isAutoPlayingRef.current) return
                  setIndex(slideIndex + 1)
                  if (slideIndex + 1 < slideCount) runStep(slideIndex + 1)
                  else {
                    setIsAutoPlaying(false)
                    isAutoPlayingRef.current = false
                  }
                }, POST_AUDIO_DELAY_MS)
                pendingTimeoutsRef.current.push(t2)
              }
              audio.addEventListener("ended", onEnded)
              audio.play().catch(() => {
                audio.removeEventListener("ended", onEnded)
                const t2 = setTimeout(() => {
                  pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== t2)
                  if (!isAutoPlayingRef.current) return
                  setIndex(slideIndex + 1)
                  if (slideIndex + 1 < slideCount) runStep(slideIndex + 1)
                  else {
                    setIsAutoPlaying(false)
                    isAutoPlayingRef.current = false
                  }
                }, POST_AUDIO_DELAY_MS)
                pendingTimeoutsRef.current.push(t2)
              })
            } else {
              const t2 = setTimeout(() => {
                pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== t2)
                if (!isAutoPlayingRef.current) return
                setIndex(slideIndex + 1)
                if (slideIndex + 1 < slideCount) runStep(slideIndex + 1)
                else {
                  setIsAutoPlaying(false)
                  isAutoPlayingRef.current = false
                }
              }, POST_AUDIO_DELAY_MS)
              pendingTimeoutsRef.current.push(t2)
            }
          })
          .catch(() => {
            if (!isAutoPlayingRef.current) return
            const t2 = setTimeout(() => {
              pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== t2)
              if (!isAutoPlayingRef.current) return
              setIndex(slideIndex + 1)
              if (slideIndex + 1 < slideCount) runStep(slideIndex + 1)
              else {
                setIsAutoPlaying(false)
                isAutoPlayingRef.current = false
              }
            }, POST_AUDIO_DELAY_MS)
            pendingTimeoutsRef.current.push(t2)
          })
      }, PRE_AUDIO_DELAY_MS)
      pendingTimeoutsRef.current.push(t1)
    },
    [orgSlug, slideCount, slideIds]
  )

  const playAutoPlay = useCallback(() => {
    clearPendingTimeouts()
    narrationAudioRef.current?.pause()
    isAutoPlayingRef.current = true
    setIsAutoPlaying(true)
    runStep(index)
  }, [index, runStep, clearPendingTimeouts])

  const pauseAutoPlay = useCallback(() => {
    isAutoPlayingRef.current = false
    setIsAutoPlaying(false)
    clearPendingTimeouts()
    narrationAudioRef.current?.pause()
  }, [clearPendingTimeouts])

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
    const elFs = el as unknown as { requestFullscreen?: () => Promise<void>; webkitRequestFullscreen?: () => Promise<void> }
    if (elFs.requestFullscreen) {
      elFs.requestFullscreen()
    } else if (elFs.webkitRequestFullscreen) {
      elFs.webkitRequestFullscreen()
    }
  }, [])

  const exitFullscreen = useCallback(() => {
    const doc = document as unknown as { exitFullscreen?: () => Promise<void>; webkitExitFullscreen?: () => void }
    if (doc.exitFullscreen) {
      doc.exitFullscreen()
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/95 p-6 text-center text-slate-300">
            <p>
              Slides couldn’t be loaded in the browser. This can happen if the presentation is large or the server is busy.
            </p>
            <a
              href={downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Download presentation
            </a>
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

      {/* Narration auto-play: single hidden audio element */}
      {canAutoPlayNarration && (
        <audio ref={narrationAudioRef} className="sr-only" preload="none" />
      )}

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
          {canAutoPlayNarration && (
            isAutoPlaying ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-white hover:bg-white/15"
                onClick={pauseAutoPlay}
                aria-label="Pause narration"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-white hover:bg-white/15"
                onClick={playAutoPlay}
                aria-label="Play narration and advance slides"
              >
                <Play className="h-4 w-4" />
                Play
              </Button>
            )
          )}
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
