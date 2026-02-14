"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Play } from "lucide-react"
import { NarrationPlayer } from "./narration-player"

interface SlideDeckViewerProps {
  slideDeck: any
  orgSlug: string
  canGenerateNarration?: boolean
  onComplete: () => void
  isCompleted: boolean
}

export function SlideDeckViewer({
  slideDeck,
  orgSlug,
  canGenerateNarration = false,
  onComplete,
  isCompleted,
}: SlideDeckViewerProps) {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [popupBlocked, setPopupBlocked] = useState(false)

  const slides = slideDeck?.slides ?? []
  const sourceFileId = slideDeck?.sourceFileId ?? slideDeck?.sourceFile?.id ?? null
  const presentationTitle = slideDeck?.sourceFile?.filename ?? "Presentation"
  const deckId = slideDeck?.id ?? null
  const presentationUrl =
    sourceFileId != null ? `/org/${orgSlug}/slides/view/${sourceFileId}?images=1` : null
  const trainingViewerUrl = useMemo(() => {
    if (!presentationUrl || !deckId) return null
    return `${presentationUrl}&training=1&deckId=${encodeURIComponent(deckId)}`
  }, [deckId, presentationUrl])

  // When the standalone viewer signals completion, mark this content item complete.
  useEffect(() => {
    if (!deckId || isCompleted) return

    const channelName = "pptx-training"
    let bc: BroadcastChannel | null = null
    try {
      bc = "BroadcastChannel" in window ? new BroadcastChannel(channelName) : null
    } catch {
      bc = null
    }

    const handleMessage = (data: any) => {
      if (!data || typeof data !== "object") return
      if (data.type !== "pptx-complete") return
      if (data.deckId !== deckId) return
      onComplete()
    }

    if (bc) {
      bc.onmessage = (e) => handleMessage(e.data)
    }

    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return
      if (!e.key.startsWith("pptxComplete:")) return
      try {
        const payload = JSON.parse(e.newValue)
        handleMessage(payload)
      } catch {
        // ignore
      }
    }
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("storage", onStorage)
      try {
        bc?.close()
      } catch {
        // ignore
      }
    }
  }, [deckId, isCompleted, onComplete])

  if (!slideDeck || slides.length === 0) {
    return (
      <div className="rounded-xl bg-slate-900/80 px-6 py-8 text-slate-200">
        Slide deck not found
      </div>
    )
  }

  if (sourceFileId) {
    // Prefer a dedicated presentation viewer (new tab/window) for a clean, unobstructed viewport.
    // Embedded PPTX rendering inside the dashboard layout is prone to truncation/scroll issues.
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-slate-950">
          <PptxBackdrop orgSlug={orgSlug} sourceFileId={sourceFileId} />

          {/* Opaque overlay + stage lighting (keep the slide visible) */}
          <div className="pointer-events-none absolute inset-0 bg-black/35" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_20%,hsl(var(--primary)/0.24),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/80" />

          <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="text-xs font-medium uppercase tracking-widest text-white/60">
              PowerPoint deck
            </div>
            <div className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {presentationTitle}
            </div>
            <div className="text-sm text-white/65">
              Open the presentation to view and play slides. On mobile, use &quot;Play here&quot; to avoid popup blockers.
            </div>

            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              {/* Same-tab navigation: works reliably on mobile (no popup blocking) */}
              {(trainingViewerUrl ?? presentationUrl) && (
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => {
                    const base = trainingViewerUrl ?? presentationUrl ?? ""
                    const from = `${window.location.pathname}${window.location.search}`
                    const join = base.includes("?") ? "&" : "?"
                    router.push(`${base}${join}from=${encodeURIComponent(from)}`)
                  }}
                >
                  <Play className="h-4 w-4" />
                  Play here
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => {
                  const baseUrl = trainingViewerUrl ?? presentationUrl
                  if (!baseUrl) return
                  setPopupBlocked(false)
                  const from = `${window.location.pathname}${window.location.search}`
                  const joinChar = baseUrl.includes("?") ? "&" : "?"
                  const openUrl = `${baseUrl}${joinChar}from=${encodeURIComponent(from)}`
                  const w = window.open(
                    openUrl,
                    "_blank",
                    "noopener,noreferrer",
                  )
                  if (!w) setPopupBlocked(true)
                }}
              >
                Open in new tab
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            {popupBlocked && (trainingViewerUrl ?? presentationUrl) && (
              <p className="mt-2 text-xs text-white/70">
                Popup blocked. Use &quot;Play here&quot; above to watch in this tab.
              </p>
            )}
          </div>
        </div>

        {/* No inline media tools / completion here; those belong in the actual viewer experience */}
        <div className="flex shrink-0 items-center justify-between border-t border-border/40 pt-2">
          <span className="text-sm text-slate-400">
            {slides.length} slide{slides.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    )
  }

  const isFirst = currentSlide === 0
  const isLast = currentSlide === slides.length - 1

  const renderContent = (content: string) => {
    let html = content
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/^\- (.*$)/gim, "<li>$1</li>")
      .replace(/\n/gim, "<br />")

    html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>")

    return html
  }

  return (
    <div className="space-y-6">
      {/* Slide container: dark blue, full-bleed feel, padding only */}
      <div
        className="relative min-h-[420px] overflow-hidden rounded-xl bg-[#0F2438] p-8 sm:p-10 md:p-12"
        style={{
          background:
            "linear-gradient(145deg, #122a42 0%, #0F2438 50%, #0B1C2D 100%)",
        }}
      >
        <div className="mx-auto flex min-h-[340px] max-w-3xl flex-col justify-center">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
            {slides[currentSlide].title}
          </h2>
          <div
            className="slide-content prose prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-slate-100 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-p:text-slate-200 prose-strong:text-slate-100 prose-ul:my-5 prose-ul:list-disc prose-ul:pl-6 prose-li:my-2.5 prose-li:pl-1 prose-li:text-slate-200 prose-li:leading-relaxed prose-li:marker:text-slate-400"
            dangerouslySetInnerHTML={{
              __html: renderContent(slides[currentSlide].content),
            }}
          />
        </div>
      </div>

      <NarrationPlayer
        orgSlug={orgSlug}
        entityType="SLIDE"
        entityId={slides[currentSlide].id}
        canGenerate={canGenerateNarration}
      />

      {/* Navigation: subdued, readable */}
      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <Button
          variant="outline"
          className="border-slate-600/60 text-slate-400 hover:border-slate-500 hover:bg-slate-800/50 hover:text-slate-200"
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={isFirst}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="text-sm text-slate-400">
          Slide {currentSlide + 1} of {slides.length}
        </div>

        {isLast ? (
          !isCompleted ? (
            <Button onClick={onComplete}>
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Completed</span>
            </div>
          )
        ) : (
          <Button
            variant="outline"
            className="border-slate-600/60 text-slate-400 hover:border-slate-500 hover:bg-slate-800/50 hover:text-slate-200"
            onClick={() =>
              setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))
            }
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function PptxBackdrop({
  orgSlug,
  sourceFileId,
}: {
  orgSlug: string
  sourceFileId: string
}) {
  const BASE_W = 1600
  const BASE_H = 900
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!viewportRef.current) return
    const el = viewportRef.current
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const w = Math.max(1, Math.floor(entry.contentRect.width))
      const h = Math.max(1, Math.floor(entry.contentRect.height))
      // "Cover" scale: fill the card, cropping as needed.
      const next = Math.max(w / BASE_W, h / BASE_H)
      setScale((prev) => (Math.abs(prev - next) < 0.002 ? prev : next))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!stageRef.current) return
    let mounted = true
    const el = stageRef.current
    const url = `/api/org/${orgSlug}/slides/file/${sourceFileId}`
    const bufferRef = { current: null as ArrayBuffer | null }
    let hasInited = false

    function tryInit() {
      if (hasInited) return
      const buf = bufferRef.current
      if (!buf || !mounted) return
      hasInited = true
      import("pptx-preview").then(({ init }) => {
        if (!mounted) return
        el.innerHTML = ""
        const previewer = init(el, {
          width: BASE_W,
          height: BASE_H,
          mode: "slide",
        }) as unknown as {
          preview: (b: ArrayBuffer) => Promise<unknown>
          renderSingleSlide?: (slideIndex: number) => void
        }
        previewer.preview(buf).then(() => {
          if (!mounted) return
          const forceRender = () => {
            if (typeof previewer.renderSingleSlide === "function") {
              previewer.renderSingleSlide(0)
            }
          }
          forceRender()
          requestAnimationFrame(forceRender)
          setTimeout(forceRender, 100)
          setTimeout(forceRender, 400)
        }).catch(() => {
          // ignore backdrop failures (launch UI still works)
        })
      })
    }

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
      .catch(() => {
        // ignore backdrop failures
      })

    const t = setTimeout(() => tryInit(), 300)

    return () => {
      mounted = false
      clearTimeout(t)
    }
  }, [orgSlug, sourceFileId])

  return (
    <div ref={viewportRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        ref={stageRef}
        className="absolute left-1/2 top-1/2 opacity-95 saturate-110"
        style={{
          width: BASE_W,
          height: BASE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  )
}
