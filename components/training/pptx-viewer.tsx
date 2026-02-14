"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
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
import { cn } from "@/lib/utils"

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
const LOAD_TIMEOUT_MS = 30000
const ZERO_SLIDES_DEFER_MS = 800
const LARGE_FILE_DEFER_MS = 3500
const NARRATION_PRE_DELAY_MS = 450
const NARRATION_POST_DELAY_MS = 550
const NO_NARRATION_DWELL_MS = 900

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function supportsFullscreenApi(): boolean {
  if (typeof document === "undefined") return false
  const docEl = document.documentElement as unknown as { requestFullscreen?: () => Promise<void> }
  return typeof docEl?.requestFullscreen === "function"
}

type ViewStatus = "loading" | "ready" | "error"

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

  const [status, setStatus] = useState<ViewStatus>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideCount, setSlideCount] = useState<number | null>(null)
  const [showUi, setShowUi] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false)
  const [hasNarration, setHasNarration] = useState(false)
  const [fullscreenApiAvailable, setFullscreenApiAvailable] = useState(false)
  const [preferPseudoFullscreen, setPreferPseudoFullscreen] = useState(false)

  const deckUrl = useMemo(() => {
    const base = `/api/org/${orgSlug}/slides/file/${sourceFileId}`
    return searchParams.get("raw") === "1" ? `${base}?raw=1` : base
  }, [orgSlug, sourceFileId, searchParams])

  const safeReturnTo = useMemo(() => {
    const from = searchParams.get("from")
    if (from && from.startsWith("/") && !from.startsWith("//")) return from
    return `/org/${orgSlug}/my-training`
  }, [orgSlug, searchParams])

  const closeViewer = useCallback(() => {
    try {
      window.close()
    } catch {
      // ignore
    }
    setTimeout(() => router.push(safeReturnTo), 50)
  }, [router, safeReturnTo])

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
      localStorage.setItem(`pptxComplete:${deckId}:${Date.now()}`, JSON.stringify(payload))
    } catch {
      // ignore
    }
  }, [deckId, isTraining])

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

  const retryPaint = useCallback(() => {
    const p = previewerRef.current
    if (!p?.renderSingleSlide) return
    p.renderSingleSlide(p.currentIndex)
    requestAnimationFrame(() => p.renderSingleSlide(p.currentIndex))
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const usePseudo = preferPseudoFullscreen || !fullscreenApiAvailable
    if (usePseudo) {
      setIsPseudoFullscreen((p) => !p)
      return
    }
    const target = viewportRef.current ?? document.documentElement
    try {
      if (!document.fullscreenElement) {
        await (target as unknown as { requestFullscreen: () => Promise<void> }).requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Fullscreen API failed (e.g. not user gesture on mobile); fall back to pseudo
      setIsPseudoFullscreen((p) => !p)
    }
  }, [fullscreenApiAvailable, preferPseudoFullscreen])

  const setError = useCallback((msg: string) => {
    setStatus("error")
    setErrorMessage(msg)
  }, [])

  // Load and init: fetch PPTX and render with pptx-preview (client-side only)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    let mounted = true
    let loadTimeoutId: ReturnType<typeof setTimeout> | null = null
    let initTimerId: ReturnType<typeof setTimeout> | null = null
    let buffer: ArrayBuffer | null = null

    function clearLoadTimeout() {
      if (loadTimeoutId != null) {
        clearTimeout(loadTimeoutId)
        loadTimeoutId = null
      }
    }

    function finishReady(previewer: PreviewerInstance) {
      if (!mounted) return
      clearLoadTimeout()
      previewerRef.current = previewer
      setCurrentIndex(previewer.currentIndex)
      setSlideCount(previewer.slideCount)
      const forceRender = () => previewer.renderSingleSlide?.(0)
      forceRender()
      requestAnimationFrame(forceRender)
      setTimeout(forceRender, 150)
      setTimeout(forceRender, 500)
      setStatus("ready")
    }

    function finishError(msg: string) {
      if (!mounted) return
      clearLoadTimeout()
      setError(msg)
    }

    // Reset UI state
    setStatus("loading")
    setErrorMessage(null)
    setCurrentIndex(0)
    setSlideCount(null)
    setIsPlaying(false)
    setHasNarration(false)
    activeNarrationSlideIdRef.current = null
    playbackTokenRef.current += 1
    audioRef.current?.pause()
    audioRef.current?.removeAttribute("src")

    fetch(deckUrl, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            const body = await res.json().catch(() => ({}))
            if (body?.code === "FILE_MISSING_ON_DISK") throw new Error("FILE_MISSING_ON_DISK")
            throw new Error("Presentation file not found.")
          }
          throw new Error(`Failed to load (${res.status})`)
        }
        const ct = res.headers.get("Content-Type") ?? ""
        if (ct.includes("text/html") || ct.includes("application/json")) {
          throw new Error("Server returned an error instead of the file.")
        }
        return res.arrayBuffer()
      })
      .then((buf) => {
        if (!mounted) return
        if (!buf || buf.byteLength < 100) {
          finishError("Presentation file is empty or too small.")
          return
        }
        buffer = buf
        initTimerId = setTimeout(() => {
          initTimerId = null
          if (!mounted || !buffer) return
          import("pptx-preview").then(({ init }) => {
            if (!mounted) return
            el.innerHTML = ""
            const previewer = init(el, {
              width: BASE_W,
              height: BASE_H,
              mode: "slide",
            }) as unknown as PreviewerInstance
            previewer.preview(buffer!).then(() => {
              if (!mounted) return
              if (previewer.slideCount > 0) {
                finishReady(previewer)
                return
              }
              const deferMs = buffer!.byteLength > 2 * 1024 * 1024 ? LARGE_FILE_DEFER_MS : ZERO_SLIDES_DEFER_MS
              setTimeout(() => {
                if (!mounted) return
                if (previewer.slideCount > 0) finishReady(previewer)
                else {
                  finishError(
                    "This presentation could not be rendered in the browser. Use "Open original file" to download and open in Keynote or PowerPoint."
                  )
                }
              }, deferMs)
            }).catch((err: unknown) => {
              if (!mounted) return
              const msg = String(err instanceof Error ? err.message : err)
              const isBg = /background|undefined/i.test(msg)
              finishError(
                isBg
                  ? "Slide format not supported (e.g. missing background). Use \"Open original file\" to open in Keynote or PowerPoint."
                  : "Could not parse the presentation. Use \"Open original file\" to download and open in Keynote or PowerPoint."
              )
            })
          }).catch(() => {
            if (mounted) finishError("Failed to load the presentation viewer.")
          })
        }, 100)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        finishError(
          e instanceof Error && e.message === "FILE_MISSING_ON_DISK"
            ? "Presentation file is missing on the server. Re-upload from Admin → Presentations."
            : e instanceof Error
              ? e.message
              : "Failed to load"
        )
      })

    loadTimeoutId = setTimeout(() => {
      loadTimeoutId = null
      if (mounted && !previewerRef.current) {
        finishError("Loading timed out. The file may be missing or the format may not be supported.")
      }
    }, LOAD_TIMEOUT_MS)

    return () => {
      mounted = false
      if (initTimerId) clearTimeout(initTimerId)
      clearLoadTimeout()
      previewerRef.current = null
    }
  }, [deckUrl, setError])

  // Sync index/count from library when ready
  useEffect(() => {
    if (status !== "ready") return
    const id = setInterval(() => {
      const p = previewerRef.current
      if (!p) return
      setCurrentIndex((i) => (i !== p.currentIndex ? p.currentIndex : i))
      setSlideCount((c) => (c !== p.slideCount ? p.slideCount : c))
    }, 200)
    return () => clearInterval(id)
  }, [status])

  // Resize → scale
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width: w, height: h } = entry.contentRect
      if (w <= 0 || h <= 0) return
      const next = clamp(Math.min((w - 24) / BASE_W, (h - 24) / BASE_H), 0.15, 1.5)
      setScale((prev) => (Math.abs(prev - next) < 0.002 ? prev : next))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (status !== "ready" || !viewportRef.current) return
    const el = viewportRef.current
    const id = requestAnimationFrame(() => {
      const { width: w, height: h } = el.getBoundingClientRect()
      if (w <= 0 || h <= 0) return
      const next = clamp(Math.min((w - 24) / BASE_W, (h - 24) / BASE_H), 0.15, 1.5)
      setScale((prev) => (Math.abs(prev - next) < 0.002 ? prev : next))
    })
    return () => cancelAnimationFrame(id)
  }, [status])

  useEffect(() => {
    if (!showUi) return
    const t = setTimeout(() => setShowUi(false), 2200)
    return () => clearTimeout(t)
  }, [showUi, currentIndex])

  const isFirst = currentIndex <= 0
  const isLast = slideCount == null ? false : currentIndex >= Math.max(0, slideCount - 1)
  const loaded = status === "ready"

  const getNarrationStreamUrl = useCallback(
    async (slideId: string) => {
      const cached = narrationCacheRef.current.get(slideId)
      if (cached !== undefined) return cached
      try {
        const res = await fetch(
          `/api/org/${orgSlug}/narration?entityType=SLIDE&entityId=${encodeURIComponent(slideId)}`,
          { credentials: "include" }
        )
        const data = (await res.json().catch(() => ({}))) as { hasNarration?: boolean; streamUrl?: string }
        const url = res.ok && data.hasNarration && data.streamUrl ? data.streamUrl : null
        narrationCacheRef.current.set(slideId, url)
        return url
      } catch {
        narrationCacheRef.current.set(slideId, null)
        return null
      }
    },
    [orgSlug]
  )

  // Narration playback
  useEffect(() => {
    if (!isPlaying || !loaded) return
    const slideId = slideIds[currentIndex]
    if (!slideId) {
      setIsPlaying(false)
      return
    }
    if (activeNarrationSlideIdRef.current === slideId) return
    activeNarrationSlideIdRef.current = slideId

    const token = ++playbackTokenRef.current
    let dwellId: ReturnType<typeof setTimeout> | null = null
    let postId: ReturnType<typeof setTimeout> | null = null
    let endedHandler: (() => void) | null = null
    const audio = audioRef.current

    getNarrationStreamUrl(slideId).then((url) => {
      if (token !== playbackTokenRef.current) return
      setHasNarration(!!url)
      if (!url || !audio) {
        dwellId = setTimeout(() => {
          if (token !== playbackTokenRef.current) return
          if (isLast) setIsPlaying(false)
          else goNext()
        }, NO_NARRATION_DWELL_MS)
        return
      }
      (async () => {
        await new Promise((r) => setTimeout(r, NARRATION_PRE_DELAY_MS))
        if (token !== playbackTokenRef.current) return
        try {
          if (audio.src !== url) {
            audio.src = url
            audio.load()
          }
          audio.currentTime = 0
          await audio.play()
        } catch {
          setIsPlaying(false)
          return
        }
        endedHandler = () => {
          if (endedHandler) audio.removeEventListener("ended", endedHandler)
          if (token !== playbackTokenRef.current) return
          if (isLast) {
            setIsPlaying(false)
            signalComplete()
            return
          }
          postId = setTimeout(() => {
            if (token !== playbackTokenRef.current) return
            goNext()
          }, NARRATION_POST_DELAY_MS)
        }
        audio.addEventListener("ended", endedHandler)
      })()
    })

    return () => {
      if (dwellId) clearTimeout(dwellId)
      if (postId) clearTimeout(postId)
      if (endedHandler && audio) audio.removeEventListener("ended", endedHandler)
    }
  }, [currentIndex, getNarrationStreamUrl, goNext, isLast, isPlaying, loaded, signalComplete, slideIds])

  useEffect(() => {
    if (isPlaying) return
    playbackTokenRef.current += 1
    activeNarrationSlideIdRef.current = null
    audioRef.current?.pause()
  }, [isPlaying])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
        setIsPseudoFullscreen(false)
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      }
    }
    window.addEventListener("keydown", onKey, { passive: false })
    return () => window.removeEventListener("keydown", onKey)
  }, [goNext, goPrev, toggleFullscreen])

  useEffect(() => {
    setFullscreenApiAvailable(supportsFullscreenApi())
    const mobileQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)")
    const setPrefer = () => setPreferPseudoFullscreen(mobileQuery.matches)
    setPrefer()
    mobileQuery.addEventListener("change", setPrefer)
    return () => mobileQuery.removeEventListener("change", setPrefer)
  }, [])

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  useEffect(() => {
    if (!isPseudoFullscreen) return
    const html = document.documentElement
    const body = document.body
    const prevHtml = { overflow: html.style.overflow, height: html.style.height, position: html.style.position }
    const prevBody = { overflow: body.style.overflow, height: body.style.height, position: body.style.position, width: body.style.width, top: body.style.top, left: body.style.left, right: body.style.right, bottom: body.style.bottom }
    html.style.overflow = "hidden"
    html.style.height = "100dvh"
    html.style.position = "fixed"
    body.style.overflow = "hidden"
    body.style.height = "100dvh"
    body.style.position = "fixed"
    body.style.width = "100%"
    body.style.top = "0"
    body.style.left = "0"
    body.style.right = "0"
    body.style.bottom = "0"
    return () => {
      html.style.overflow = prevHtml.overflow
      html.style.height = prevHtml.height
      html.style.position = prevHtml.position
      body.style.overflow = prevBody.overflow
      body.style.height = prevBody.height
      body.style.position = prevBody.position
      body.style.width = prevBody.width
      body.style.top = prevBody.top
      body.style.left = prevBody.left
      body.style.right = prevBody.right
      body.style.bottom = prevBody.bottom
    }
  }, [isPseudoFullscreen])

  const pseudoFullscreenStyle: React.CSSProperties = isPseudoFullscreen
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        zIndex: 2147483647,
        overflow: "hidden",
        backgroundColor: "#000",
        color: "#fff",
      }
    : {}

  const viewerContent = (
    <div
      className={cn(
        !isPseudoFullscreen && "fixed inset-0 overflow-hidden bg-black text-white",
        isPseudoFullscreen && "pptx-pseudo-fullscreen"
      )}
      style={pseudoFullscreenStyle}
      onMouseMove={() => setShowUi(true)}
      onClick={() => setShowUi(true)}
      onTouchStart={() => setShowUi(true)}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_15%,rgba(255,255,255,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_100%,hsl(var(--primary)/0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
      </div>

      <div ref={viewportRef} className="absolute inset-0 z-0">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 rounded-[32px] blur-2xl"
          style={{
            width: BASE_W * scale,
            height: BASE_H * scale,
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(60% 60% at 50% 40%, rgba(255,255,255,0.15), rgba(255,255,255,0.02) 60%, transparent 75%)",
          }}
        />
        <div
          ref={stageRef}
          className="absolute left-1/2 top-1/2 z-10 overflow-hidden rounded-2xl bg-white"
          style={{
            width: BASE_W,
            height: BASE_H,
            minWidth: BASE_W,
            minHeight: BASE_H,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "50% 50%",
            boxShadow: "0 30px 90px rgba(0,0,0,0.70), 0 6px 22px rgba(0,0,0,0.45)",
          }}
        />
      </div>

      <audio ref={audioRef} className="sr-only" preload="metadata" />

      {status === "loading" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 text-sm text-white/70">
          Loading presentation…
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur">
            <div className="text-sm font-medium">Couldn’t load the deck</div>
            <div className="mt-2 text-sm text-white/70">{errorMessage}</div>
            {slideIds.length > 0 && (
              <p className="mt-2 text-xs text-white/50">
                This deck has {slideIds.length} slides in the system; the viewer couldn’t render this file.
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={closeViewer}>
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
                  Open original file
                </Button>
              )}
              <Button type="button" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-x-0 top-0 z-30 transition-opacity duration-200 ${showUi ? "opacity-100" : "opacity-0"}`}
      >
        <div className="pointer-events-none mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-black/45 px-3 py-2 text-xs backdrop-blur">
            <span className="font-medium">{title?.trim() || "Presentation"}</span>
            {status !== "error" && (slideCount != null || slideIds.length > 0) && (
              <span className="text-white/70">
                {currentIndex + 1}/{slideCount ?? slideIds.length}
              </span>
            )}
          </div>
          <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-black/45 p-1 backdrop-blur">
            <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-white hover:bg-white/10" onClick={closeViewer} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-white hover:bg-white/10"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
            >
              {(isFullscreen || isPseudoFullscreen) ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-30 transition-opacity duration-200 ${showUi ? "opacity-100" : "opacity-0"}`}
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
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
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
                ? "Tip: ← → navigate, Space play/pause narration, F fullscreen"
                : "Tip: ← → navigate, Space play/pause, F fullscreen"}
            </span>
            <button type="button" onClick={retryPaint} className="shrink-0 text-white/90 underline hover:text-white">
              Slides not showing? Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (isPseudoFullscreen && typeof document !== "undefined" && document.body) {
    return createPortal(viewerContent, document.body)
  }
  return viewerContent
}
