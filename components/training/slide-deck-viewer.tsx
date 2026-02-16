"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react"
import { NarrationPlayer } from "./narration-player"
import { SlideShowViewer } from "./slide-show-viewer"

interface SlideDeckViewerProps {
  slideDeck: any
  orgSlug: string
  canGenerateNarration?: boolean
  onComplete: () => void
  isCompleted: boolean
}

/**
 * Slide deck training module: in-browser slide show (image-based) + download + mark complete.
 * Fallback: if no source file, show slide content as text with prev/next + complete.
 */
export function SlideDeckViewer({
  slideDeck,
  orgSlug,
  canGenerateNarration = false,
  onComplete,
  isCompleted,
}: SlideDeckViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = slideDeck?.slides ?? []
  const sourceFileId = slideDeck?.sourceFileId ?? slideDeck?.sourceFile?.id ?? null
  const presentationTitle = slideDeck?.sourceFile?.filename ?? "Presentation"
  const downloadUrl =
    sourceFileId != null
      ? `/api/org/${orgSlug}/slides/file/${sourceFileId}`
      : null
  const showUrl =
    sourceFileId != null
      ? `/org/${orgSlug}/slides/show/${sourceFileId}`
      : null

  if (!slideDeck || slides.length === 0) {
    return (
      <div className="rounded-xl bg-slate-900/80 px-6 py-8 text-slate-200">
        Slide deck not found
      </div>
    )
  }

  // PPTX-backed deck: in-browser slide show (server-rendered PNGs) + download + complete
  if (sourceFileId && downloadUrl) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/40 bg-slate-950">
        <SlideShowViewer
          orgSlug={orgSlug}
          sourceFileId={sourceFileId}
          slideCount={slides.length}
          title={presentationTitle}
          downloadUrl={downloadUrl}
          slideIds={slides.map((s) => s.id)}
          onComplete={onComplete}
          isCompleted={isCompleted}
          embedded
        />
        {showUrl && (
          <div className="flex shrink-0 justify-end border-t border-white/10 px-2 py-1">
            <Button variant="ghost" size="sm" asChild>
              <a
                href={showUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5 text-white/70 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </a>
            </Button>
          </div>
        )}
      </div>
    )
  }

  // No source file: show slide content as text (fallback)
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
      <div
        className="relative min-h-[420px] overflow-hidden rounded-xl bg-[#0F2438] p-8 sm:p-10 md:p-12"
        style={{
          background: "linear-gradient(145deg, #122a42 0%, #0F2438 50%, #0B1C2D 100%)",
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
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
