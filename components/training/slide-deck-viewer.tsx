"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"

interface SlideDeckViewerProps {
  slideDeck: any
  onComplete: () => void
  isCompleted: boolean
}

export function SlideDeckViewer({
  slideDeck,
  onComplete,
  isCompleted,
}: SlideDeckViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  if (!slideDeck || !slideDeck.slides || slideDeck.slides.length === 0) {
    return <div>Slide deck not found</div>
  }

  const slides = slideDeck.slides
  const isFirst = currentSlide === 0
  const isLast = currentSlide === slides.length - 1

  // Simple markdown-like rendering
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
    <div className="space-y-4">
      <div className="bg-white border rounded-lg p-8 min-h-[400px]">
        <h2 className="text-2xl font-bold mb-4">{slides[currentSlide].title}</h2>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{
            __html: renderContent(slides[currentSlide].content),
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={isFirst}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="text-sm text-gray-600">
          Slide {currentSlide + 1} of {slides.length}
        </div>

        {isLast ? (
          !isCompleted ? (
            <Button onClick={onComplete}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Completed</span>
            </div>
          )
        ) : (
          <Button
            onClick={() =>
              setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))
            }
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
