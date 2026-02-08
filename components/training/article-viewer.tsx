"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { NarrationPlayer } from "./narration-player"

interface ArticleViewerProps {
  article: any
  contentItemId: string
  orgSlug: string
  canGenerateNarration?: boolean
  onComplete: () => void
  isCompleted: boolean
}

export function ArticleViewer({
  article,
  contentItemId,
  orgSlug,
  canGenerateNarration = false,
  onComplete,
  isCompleted,
}: ArticleViewerProps) {
  if (!article) {
    return <div>Article not found</div>
  }

  // Simple markdown-like rendering (convert ** to bold, # to headings, etc.)
  const renderContent = (content: string) => {
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      // Lists
      .replace(/^\- (.*$)/gim, "<li>$1</li>")
      // Line breaks
      .replace(/\n/gim, "<br />")
    
    // Wrap list items
    html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>")
    
    return html
  }

  return (
    <div className="space-y-4">
      <NarrationPlayer
        orgSlug={orgSlug}
        entityType="ARTICLE"
        entityId={contentItemId}
        canGenerate={canGenerateNarration}
      />
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: renderContent(article.content) }}
      />
      {!isCompleted && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onComplete}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        </div>
      )}
      {isCompleted && (
        <div className="flex items-center gap-2 text-green-600 pt-4 border-t">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Completed</span>
        </div>
      )}
    </div>
  )
}
