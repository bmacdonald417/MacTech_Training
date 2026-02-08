"use client"

import { ContentViewer } from "@/components/training/content-viewer"
import { Card, CardContent } from "@/components/ui/card"

interface ContentPreviewProps {
  contentItem: {
    id: string
    type: string
    title: string
    description: string | null
    article: unknown
    slideDeck: unknown
    video: unknown
    formTemplate: unknown
    quiz: unknown
    attestationTemplate: unknown
  }
}

export function ContentPreview({ contentItem }: ContentPreviewProps) {
  const previewable = ["ARTICLE", "SLIDE_DECK", "VIDEO"].includes(contentItem.type)

  if (previewable) {
    return (
      <ContentViewer
        contentItem={contentItem}
        onComplete={() => {}}
        isCompleted={true}
        isSubmitting={false}
        enrollmentId=""
        orgSlug=""
        userId=""
      />
    )
  }

  return (
    <Card>
      <CardContent className="py-8">
        <p className="text-muted-foreground">
          This content type is used inside assignments. Preview it by creating an assignment and
          launching the training.
        </p>
      </CardContent>
    </Card>
  )
}
