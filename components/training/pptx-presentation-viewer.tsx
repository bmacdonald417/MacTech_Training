"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type PreviewerInstance = {
  preview: (buffer: ArrayBuffer) => Promise<unknown>
  renderPreSlide: () => void
  renderNextSlide: () => void
  get currentIndex(): number
  get slideCount(): number
}

const BASE_W = 1600
const BASE_H = 900

const NARRATION_PRE_DELAY_MS = 450
const NARRATION_POST_DELAY_MS = 550
const NO_NARRATION_DWELL_MS = 900

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function canFullscreen(el: HTMLElement | null) {
  if (typeof document === "undefined") return false
  const anyEl = (el ?? document.documentElement) as unknown as {
    requestFullscreen?: () => Promise<void>
  }
  return typeof anyEl?.requestFullscreen === "function"
}

export function PptxPresentationViewer({
  orgSlug,
  sourceFileId,
  title,
  slideIds,
}: {
  orgSlug: string
  sourceFileId: string
  title?: string
  slideIds: string[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const deckId = searchParams.get("deckId")
  const isTraining = searchParams.get("training") === "1"
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const previewerRef = useRef<PreviewerInstance | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playbackTokenRef = useRef(0)
  const narrationCacheRef = useRef<Map<string, string | null>>(new Map())
  const activeNarrationSlideIdRef = useRef<string | null>(null)

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideCount, setSlideCount] = useState<number | null>(null)
  const [showUi, setShowUi] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasNarration, setHasNarration] = useState(false)

  const deckUrl = useMemo(
    () => `/api/org/${orgSlug}/slides/file/${sourceFileId}`,
    [orgSlug, sourceFileId],
  )

  const safeReturnTo = useMemo(() => {
    const from = searchParams.get("from")
    if (from && from.startsWith("/") && !from.startsWith("//")) return from
    return `/org/${orgSlug}/my-training`
  }, [orgSlug, searchParams])

  const signalComplete = useCallback(() => {
    if (!isTraining || !deckId) return
    const payload = { type: "pptx-complete", deckId }
    try {
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("pptx-training")
        bc.postMessage(payload)
        bc.close()
      }
    } catch {
      // ignore
    }
    try {
      // localStorage fallback (also works for same-origin tabs)
      localStorage.setItem(
        `pptxComplete:${deckId}:${Date.now()}`,
        JSON.stringify(payload)
      )
    } catch {
      // ignore
    }
  }, [deckId, isTraining])

  const closeViewer = useCallback(() => {
    // When opened via window.open, back() does nothing (no history). Prefer close.
    try {
      window.close()
    } catch {
      // ignore
    }
    // Fallback navigation in case the browser blocks window.close().
    setTimeout(() => router.push(safeReturnTo), 50)
  }, [router, safeReturnTo])

  const goPrev = useCallback(() => {
    const p = previewerRef.current
    if (!p || p.currentIndex <= 0) return
    p.renderPreSlide()
    requestAnimationFrame(() => setCurrentIndex(p.currentIndex))
  }, [])

  const goNext = useCallback(() => {
    const p = previewerRef.current
    if (!p) return
    const last = p.slideCount - 1
    if (p.currentIndex >= last) return
    p.renderNextSlide()
    requestAnimationFrame(() => setCurrentIndex(p.currentIndex))
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const target = viewportRef.current ?? document.documentElement
    if (!canFullscreen(target)) return
    try {
      if (!document.fullscreenElement) {
        const el = target as unknown as { requestFullscreen: () => Promise<void> }
        await el.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // ignore
    }
  }, [])

  // Init viewer once (fixed base resolution), scale separately via CSS.
  useEffect(() => {
    if (!stageRef.current) return
    let mounted = true
    const el = stageRef.current
    const bufferRef = { current: null as ArrayBuffer | null }
    let hasInited = false

    setLoaded(false)
    setError(null)
    setCurrentIndex(0)
    setSlideCount(null)
    setIsPlaying(false)
    setHasNarration(false)
    activeNarrationSlideIdRef.current = null
    playbackTokenRef.current += 1
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute("src")
      audioRef.current.load()
    }

    function tryInit() {
      if (hasInited) return
      const buf = bufferRef.current
      if (!buf || !mounted) return
      hasInited = true
      import("pptx-preview").then(({ init }) => {
        if (!mounted) return
        el.innerHTML = ""
        previewerRef.current = null

        const previewer = init(el, {
          width: BASE_W,
          height: BASE_H,
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

    fetch(deckUrl, { credentials: "include" })
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
        if (!mounted) return
        setError(e instanceof Error ? e.message : "Failed to load")
      })

    const fallbackTimer = setTimeout(() => tryInit(), 250)

    return () => {
      mounted = false
      clearTimeout(fallbackTimer)
      previewerRef.current = null
    }
  }, [deckUrl])

  // Keep currentIndex/slideCount in sync with library.
  useEffect(() => {
    if (!loaded) return
    const id = setInterval(() => {
      const p = previewerRef.current
      if (!p) return
      setCurrentIndex((i) => (i !== p.currentIndex ? p.currentIndex : i))
      setSlideCount((c) => (c !== p.slideCount ? p.slideCount : c))
    }, 250)
    return () => clearInterval(id)
  }, [loaded])

  // Resize observer -> scale (keeps slide visible on resize and when viewport is ready).
  useEffect(() => {
    if (!viewportRef.current) return
    const el = viewportRef.current

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const availW = Math.floor(entry.contentRect.width)
      const availH = Math.floor(entry.contentRect.height)
      if (availW <= 0 || availH <= 0) return
      const pad = 24
      const next = clamp(
        Math.min((availW - pad) / BASE_W, (availH - pad) / BASE_H),
        0.15,
        1.5,
      )
      setScale((prev) => (Math.abs(prev - next) < 0.002 ? prev : next))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // When deck finishes loading, re-measure viewport so scale is correct (helps mobile / small viewports).
  useEffect(() => {
    if (!loaded || !viewportRef.current) return
    const el = viewportRef.current
    const id = requestAnimationFrame(() => {
      const { width: availW, height: availH } = el.getBoundingClientRect()
      if (availW <= 0 || availH <= 0) return
      const pad = 24
      const next = clamp(
        Math.min((availW - pad) / BASE_W, (availH - pad) / BASE_H),
        0.15,
        1.5,
      )
      setScale((prev) => (Math.abs(prev - next) < 0.002 ? prev : next))
    })
    return () => cancelAnimationFrame(id)
  }, [loaded])

  // Auto-hide UI like a native presentation app.
  useEffect(() => {
    if (!showUi) return
    const t = setTimeout(() => setShowUi(false), 2200)
    return () => clearTimeout(t)
  }, [showUi, currentIndex])

  const isFirst = currentIndex <= 0
  const isLast =
    slideCount == null ? false : currentIndex >= Math.max(0, slideCount - 1)

  const getNarrationStreamUrl = useCallback(
    async (slideId: string) => {
      const cached = narrationCacheRef.current.get(slideId)
      if (cached !== undefined) return cached
      try {
        const res = await fetch(
          `/api/org/${orgSlug}/narration?entityType=SLIDE&entityId=${encodeURIComponent(slideId)}`,
          { credentials: "include" },
        )
        const data = (await res.json().catch(() => ({}))) as {
          hasNarration?: boolean
          streamUrl?: string
        }
        const url =
          res.ok && data.hasNarration && data.streamUrl ? data.streamUrl : null
        narrationCacheRef.current.set(slideId, url)
        return url
      } catch {
        narrationCacheRef.current.set(slideId, null)
        return null
      }
    },
    [orgSlug],
  )

  // Narrated slideshow playback:
  // - On Play: play current slide narration (if exists), then advance on end.
  // - If narration missing: short dwell, then advance.
  useEffect(() => {
    if (!isPlaying || !loaded) return

    const slideId = slideIds[currentIndex]
    if (!slideId) {
      setIsPlaying(false)
      return
    }

    // Avoid re-triggering if we already started narration for this slide.
    if (activeNarrationSlideIdRef.current === slideId) return
    activeNarrationSlideIdRef.current = slideId

    const token = ++playbackTokenRef.current
    let dwellTimeoutId: ReturnType<typeof setTimeout> | null = null
    let preDelayTimeoutId: ReturnType<typeof setTimeout> | null = null
    let postDelayTimeoutId: ReturnType<typeof setTimeout> | null = null
    let endedHandler: (() => void) | null = null
    const audio = audioRef.current

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        preDelayTimeoutId = setTimeout(resolve, ms)
      })

    async function run() {
      const url = await getNarrationStreamUrl(slideId)
      if (token !== playbackTokenRef.current) return

      setHasNarration(!!url)

      // If no narration saved, just dwell briefly.
      if (!url || !audioRef.current) {
        dwellTimeoutId = setTimeout(() => {
          if (token !== playbackTokenRef.current) return
          if (isLast) {
            setIsPlaying(false)
            return
          }
          goNext()
        }, NO_NARRATION_DWELL_MS)
        return
      }

      if (!audio) return
      try {
        // Small beat before narration starts (feels more natural).
        await sleep(NARRATION_PRE_DELAY_MS)
        if (token !== playbackTokenRef.current) return

        if (audio.src !== url) {
          audio.src = url
          audio.load()
        }
        audio.currentTime = 0
        await audio.play()
      } catch {
        // Autoplay restrictions or decoding issue; stop playback gracefully.
        setIsPlaying(false)
        return
      }

      endedHandler = () => {
        if (endedHandler) audio.removeEventListener("ended", endedHandler)
        if (token !== playbackTokenRef.current) return
        if (isLast) {
          setIsPlaying(false)
          // Mark complete when the final slide narration finishes.
          signalComplete()
          return
        }
        // Small beat after narration ends before advancing.
        postDelayTimeoutId = setTimeout(() => {
          if (token !== playbackTokenRef.current) return
          goNext()
        }, NARRATION_POST_DELAY_MS)
      }
      audio.addEventListener("ended", endedHandler)
    }

    run()

    return () => {
      if (dwellTimeoutId) clearTimeout(dwellTimeoutId)
      if (preDelayTimeoutId) clearTimeout(preDelayTimeoutId)
      if (postDelayTimeoutId) clearTimeout(postDelayTimeoutId)
      if (endedHandler && audio) audio.removeEventListener("ended", endedHandler)
    }
  }, [
    currentIndex,
    getNarrationStreamUrl,
    goNext,
    isLast,
    isPlaying,
    loaded,
    signalComplete,
    slideIds,
  ])

  // When paused/stopped, cancel any active narration and allow replay on same slide.
  useEffect(() => {
    if (isPlaying) return
    playbackTokenRef.current += 1
    activeNarrationSlideIdRef.current = null
    if (audioRef.current) audioRef.current.pause()
  }, [isPlaying])

  // Keyboard controls.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        setShowUi(true)
        activeNarrationSlideIdRef.current = null
        goPrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        setShowUi(true)
        activeNarrationSlideIdRef.current = null
        goNext()
      } else if (e.key === " ") {
        e.preventDefault()
        setShowUi(true)
        setIsPlaying((p) => !p)
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault()
        setShowUi(true)
        toggleFullscreen()
      } else if (e.key === "Escape") {
        setShowUi(true)
      }
    }
    window.addEventListener("keydown", onKeyDown, { passive: false })
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [goNext, goPrev, toggleFullscreen])

  // Fullscreen state.
  useEffect(() => {
    function onFs() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black text-white"
      onMouseMove={() => setShowUi(true)}
      onClick={() => setShowUi(true)}
      onTouchStart={() => setShowUi(true)}
    >
      {/* Stage background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_15%,rgba(255,255,255,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_100%,hsl(var(--primary)/0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
      </div>

      {/* Viewport: stage must scale from center so it stays on screen (especially on mobile) */}
      <div ref={viewportRef} className="absolute inset-0 z-0">
        {/* Soft glow behind slide */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 rounded-[32px] blur-2xl"
          style={{
            width: BASE_W * scale,
            height: BASE_H * scale,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(60% 60% at 50% 40%, rgba(255,255,255,0.15), rgba(255,255,255,0.02) 60%, transparent 75%)",
          }}
        />

        {/* Render target: scale from center so slide stays visible on all viewports */}
        <div
          ref={stageRef}
          className="absolute left-1/2 top-1/2 z-10 overflow-hidden rounded-2xl bg-white"
          style={{
            width: BASE_W,
            height: BASE_H,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "50% 50%",
            boxShadow:
              "0 30px 90px rgba(0,0,0,0.70), 0 6px 22px rgba(0,0,0,0.45)",
          }}
        />
      </div>

      <audio ref={audioRef} className="sr-only" preload="metadata" />

      {/* Loading / error overlays — only when not loaded so stage is visible once ready */}
      {!loaded && !error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 text-sm text-white/70">
          Loading presentation…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur">
            <div className="text-sm font-medium">Couldn’t load the deck</div>
            <div className="mt-2 text-sm text-white/70">{error}</div>
            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeViewer}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* UI chrome — above stage so controls are tappable */}
      <div
        className={[
          "absolute inset-x-0 top-0 z-30 transition-opacity duration-200",
          showUi ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <div className="pointer-events-none mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-black/45 px-3 py-2 text-xs backdrop-blur">
            <span className="font-medium">{title?.trim() ? title : "Presentation"}</span>
            {(slideCount != null || slideIds.length > 0) && (
              <span className="text-white/70">
                {currentIndex + 1}/{slideCount ?? slideIds.length}
              </span>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-black/45 p-1 backdrop-blur">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-white hover:bg-white/10"
              onClick={closeViewer}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-white hover:bg-white/10"
              onClick={toggleFullscreen}
              disabled={!canFullscreen(viewportRef.current)}
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={[
          "absolute inset-x-0 bottom-0 z-30 transition-opacity duration-200",
          showUi ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <div className="pointer-events-none mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-black/45 p-2 backdrop-blur">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={goPrev}
              disabled={!loaded || isFirst}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={goNext}
              disabled={!loaded || isLast}
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="mx-1 h-6 w-px bg-white/10" />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={() => {
                activeNarrationSlideIdRef.current = null
                setIsPlaying((p) => !p)
              }}
              disabled={!loaded}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            {isTraining && isLast && (
              <Button
                type="button"
                variant="secondary"
                className="ml-2 h-10"
                onClick={() => {
                  signalComplete()
                  closeViewer()
                }}
              >
                Complete
              </Button>
            )}
          </div>

          <div className="pointer-events-auto rounded-2xl bg-black/45 px-3 py-2 text-xs text-white/70 backdrop-blur">
            {hasNarration
              ? "Tip: ← → to navigate, Space to play/pause narration, F for fullscreen"
              : "Tip: ← → to navigate, Space to play/pause, F for fullscreen"}
          </div>
        </div>
      </div>
    </div>
  )
}

