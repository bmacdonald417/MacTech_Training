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
  renderSingleSlide: (slideIndex: number) => void
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

function renderOutlineContent(content: string): string {
  let html = content
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/^\- (.*$)/gim, "<li>$1</li>")
    .replace(/\n/gim, "<br />")
  return html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>")
}

export type FallbackSlide = { id: string; title: string; content: string }

export function PptxPresentationViewer({
  orgSlug,
  sourceFileId,
  title,
  slideIds,
  fallbackSlides,
}: {
  orgSlug: string
  sourceFileId: string
  title?: string
  slideIds: string[]
  fallbackSlides?: FallbackSlide[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const deckId = searchParams.get("deckId")
  const isTraining = searchParams.get("training") === "1"
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const previewerRef = useRef<PreviewerInstance | null>(null)
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playbackTokenRef = useRef(0)
  const narrationCacheRef = useRef<Map<string, string | null>>(new Map())
  const activeNarrationSlideIdRef = useRef<string | null>(null)

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useFallbackView, setUseFallbackView] = useState(false)
  const [scale, setScale] = useState(1)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideCount, setSlideCount] = useState<number | null>(null)
  const [showUi, setShowUi] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasNarration, setHasNarration] = useState(false)

  const deckUrl = useMemo(() => {
    const base = `/api/org/${orgSlug}/slides/file/${sourceFileId}`
    return searchParams.get("raw") === "1" ? `${base}?raw=1` : base
  }, [orgSlug, sourceFileId, searchParams])

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
    if (useFallbackView) {
      setCurrentIndex((i) => Math.max(0, i - 1))
      return
    }
    const p = previewerRef.current
    if (!p || p.currentIndex <= 0) return
    p.renderPreSlide()
    requestAnimationFrame(() => setCurrentIndex(p.currentIndex))
  }, [useFallbackView])

  const goNext = useCallback(() => {
    if (useFallbackView) {
      const n = slideCount ?? 0
      setCurrentIndex((i) => (n <= 0 ? 0 : Math.min(n - 1, i + 1)))
      return
    }
    const p = previewerRef.current
    if (!p) return
    const last = p.slideCount - 1
    if (p.currentIndex >= last) return
    p.renderNextSlide()
    requestAnimationFrame(() => setCurrentIndex(p.currentIndex))
  }, [useFallbackView, slideCount])

  const retryPaint = useCallback(() => {
    const p = previewerRef.current
    if (!p || typeof p.renderSingleSlide !== "function") return
    p.renderSingleSlide(p.currentIndex)
    requestAnimationFrame(() => p.renderSingleSlide(p.currentIndex))
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
    const log = (step: string, data?: Record<string, unknown>) => {
      if (typeof console !== "undefined") {
        console.info(`[pptx-viewer] ${step}`, data ?? "")
      }
    }
    const logError = (step: string, err: unknown) => {
      if (typeof console !== "undefined") {
        console.error(`[pptx-viewer] ERROR at ${step}:`, err)
        if (err instanceof Error && err.stack) console.error("[pptx-viewer] stack:", err.stack)
      }
    }

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

    const LOAD_TIMEOUT_MS = 25000

    log("1. Fetch starting", { url: deckUrl })
    fetch(deckUrl, { credentials: "include" })
      .then(async (res) => {
        const status = res.status
        const ct = res.headers.get("Content-Type") ?? ""
        const cl = res.headers.get("Content-Length") ?? ""
        log("2. Fetch response received", { status, contentType: ct, contentLength: cl, ok: res.ok })
        if (!res.ok) {
          if (status === 404) {
            const body = await res.json().catch(() => ({}))
            if (body?.code === "FILE_MISSING_ON_DISK") {
              throw new Error("FILE_MISSING_ON_DISK")
            }
            throw new Error("Presentation file not found. It may not have been saved yet.")
          }
          throw new Error(`Failed to load presentation (${status})`)
        }
        if (ct.includes("text/html") || ct.includes("application/json")) {
          const text = await res.text()
          logError("2. Fetch body is not binary", { contentType: ct, bodyPreview: text.slice(0, 200) })
          throw new Error("Server returned an error instead of the presentation file.")
        }
        const buf = await res.arrayBuffer()
        log("3. ArrayBuffer received", { byteLength: buf.byteLength })
        return buf
      })
      .then((buf) => {
        if (!mounted) return
        if (!buf || buf.byteLength < 100) {
          logError("3. Buffer too small", { byteLength: buf?.byteLength ?? 0 })
          setError("Presentation file is empty or too small.")
          return
        }
        bufferRef.current = buf
        log("4. Buffer stored, scheduling tryInit in 100ms", { byteLength: buf.byteLength })
        initTimerRef.current = setTimeout(() => tryInit(), 100)
      })
      .catch((e) => {
        if (!mounted) return
        logError("Fetch or buffer", e)
        setError(
          e instanceof Error && e.message === "FILE_MISSING_ON_DISK"
            ? "Presentation file is missing on the server. Re-upload the deck from Admin → Presentations."
            : e instanceof Error
              ? e.message
              : "Failed to load"
        )
      })

    function tryInit() {
      if (hasInited) return
      const buf = bufferRef.current
      if (!buf || !mounted) return
      hasInited = true
      log("5. tryInit: calling dynamic import('pptx-preview')", { bufferBytes: buf.byteLength })
      import("pptx-preview").then(({ init }) => {
        if (!mounted) return
        log("6. pptx-preview module loaded, calling init()")
        el.innerHTML = ""
        previewerRef.current = null

        const previewer = init(el, {
          width: BASE_W,
          height: BASE_H,
          mode: "slide",
        }) as unknown as PreviewerInstance

        log("7. init() done, calling preview(buffer)")
        previewer.preview(buf).then(() => {
          if (!mounted) return
          const count = previewer.slideCount
          const idx = previewer.currentIndex
          const previewerKeys = typeof previewer === "object" && previewer !== null ? Object.keys(previewer) : []
          log("8. preview() RESOLVED", {
            slideCount: count,
            currentIndex: idx,
            previewerKeys,
            hasRenderSingleSlide: typeof (previewer as { renderSingleSlide?: unknown }).renderSingleSlide,
          })
          const applySuccess = () => {
            if (!mounted) return
            log("9. applySuccess: setting previewerRef, state, forceRender(0)")
            previewerRef.current = previewer
            setCurrentIndex(previewer.currentIndex)
            setSlideCount(previewer.slideCount)
            const forceRender = () => {
              if (typeof previewer.renderSingleSlide === "function") {
                previewer.renderSingleSlide(0)
              }
            }
            forceRender()
            requestAnimationFrame(forceRender)
            setTimeout(forceRender, 100)
            setTimeout(forceRender, 400)
            setTimeout(forceRender, 800)
            setTimeout(forceRender, 1500)
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (mounted) {
                  log("10. setLoaded(true) — viewer ready")
                  setLoaded(true)
                }
              })
            })
          }
          if (previewer.slideCount > 0) {
            applySuccess()
            return
          }
          const deferMs = buf.byteLength > 2 * 1024 * 1024 ? 2500 : 450
          log("8b. slideCount is 0 — deferring error for ms", { deferMs })
          setTimeout(() => {
            if (!mounted) return
            const countNow = previewer.slideCount
            log("8c. After defer", { slideCount: countNow })
            if (countNow > 0) applySuccess()
            else if (fallbackSlides && fallbackSlides.length > 0) {
              log("8d. Using outline fallback:", { slideCount: fallbackSlides.length })
              if (loadTimeoutIdRef.current) {
                clearTimeout(loadTimeoutIdRef.current)
                loadTimeoutIdRef.current = null
              }
              setSlideCount(fallbackSlides.length)
              setCurrentIndex(0)
              setUseFallbackView(true)
              setLoaded(true)
            } else {
              logError("8d. Final: pptx-preview reports 0 slides", { previewerKeys: Object.keys(previewer) })
              if (loadTimeoutIdRef.current) {
                clearTimeout(loadTimeoutIdRef.current)
                loadTimeoutIdRef.current = null
              }
              setError(
                "The presentation has no slides the viewer could render. Try “Try original file” below, or re-save in PowerPoint with standard slide layouts."
              )
            }
          }, deferMs)
        }).catch((err) => {
          if (!mounted) return
          logError("8. preview() REJECTED", err)
          if (loadTimeoutIdRef.current) {
            clearTimeout(loadTimeoutIdRef.current)
            loadTimeoutIdRef.current = null
          }
          const msg = String(err?.message ?? err)
          const isBackgroundError = /background|undefined/i.test(msg)
          setError(
            isBackgroundError
              ? "This presentation uses a slide format the viewer doesn't support (e.g. custom or missing slide background). Re-save the file in PowerPoint as a standard .pptx, or try simplifying slide designs."
              : "Could not parse the presentation. The file may be corrupted or in an unsupported format."
          )
        })
      }).catch((err) => {
        if (!mounted) return
        logError("6. dynamic import(pptx-preview) REJECTED", err)
        if (loadTimeoutIdRef.current) {
          clearTimeout(loadTimeoutIdRef.current)
          loadTimeoutIdRef.current = null
        }
        setError("Failed to load the presentation viewer.")
      })
    }

    loadTimeoutIdRef.current = setTimeout(() => {
      if (!mounted || previewerRef.current) return
      if (loadTimeoutIdRef.current === null) return // already cleared by error path
      logError("Load timeout: previewer never ready", { timeoutMs: LOAD_TIMEOUT_MS })
      setError("Loading timed out. The file may be missing on the server or the presentation format may not be supported.")
    }, LOAD_TIMEOUT_MS)

    return () => {
      mounted = false
      if (initTimerRef.current) clearTimeout(initTimerRef.current)
      initTimerRef.current = null
      if (loadTimeoutIdRef.current) {
        clearTimeout(loadTimeoutIdRef.current)
        loadTimeoutIdRef.current = null
      }
      previewerRef.current = null
    }
  }, [deckUrl, fallbackSlides])

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
        {/* Outline fallback when pptx-preview reports 0 slides but we have imported slide data */}
        {useFallbackView && fallbackSlides && fallbackSlides.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
            <div
              className="w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-black/70 p-8 shadow-2xl backdrop-blur"
              style={{ maxHeight: "80vh" }}
            >
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-white/50">
                Outline view (slide content from import)
              </p>
              <h2 className="mb-6 text-2xl font-semibold tracking-tight text-white">
                {fallbackSlides[currentIndex]?.title ?? `Slide ${currentIndex + 1}`}
              </h2>
              <div
                className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:text-slate-100 prose-p:text-slate-200 prose-ul:text-slate-200 prose-li:text-slate-200"
                dangerouslySetInnerHTML={{
                  __html: renderOutlineContent(fallbackSlides[currentIndex]?.content ?? ""),
                }}
              />
            </div>
          </div>
        )}

        {!useFallbackView && (
          <>
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
              className="absolute left-1/2 top-1/2 z-10 overflow-hidden rounded-2xl bg-white relative"
              style={{
                width: BASE_W,
                height: BASE_H,
                minWidth: BASE_W,
                minHeight: BASE_H,
                transform: `translate(-50%, -50%) scale(${scale})`,
                transformOrigin: "50% 50%",
                boxShadow:
                  "0 30px 90px rgba(0,0,0,0.70), 0 6px 22px rgba(0,0,0,0.45)",
              }}
            />
          </>
        )}
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
            {slideIds.length > 0 && (
              <p className="mt-2 text-xs text-white/50">
                This deck has {slideIds.length} slides in the system; the viewer couldn’t render this file.
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeViewer}
              >
                Back
              </Button>
              {searchParams.get("raw") !== "1" && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set("raw", "1")
                    window.location.href = url.toString()
                  }}
                >
                  Try original file
                </Button>
              )}
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
            {!error && (slideCount != null || slideIds.length > 0) && (
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

          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-black/45 px-3 py-2 text-xs text-white/70 backdrop-blur">
            <span>
              {hasNarration
                ? "Tip: ← → to navigate, Space to play/pause narration, F for fullscreen"
                : "Tip: ← → to navigate, Space to play/pause, F for fullscreen"}
            </span>
            <button
              type="button"
              onClick={retryPaint}
              className="shrink-0 text-white/90 underline hover:text-white"
            >
              Slides not showing? Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

