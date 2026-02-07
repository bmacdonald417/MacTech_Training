"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { ArticleViewer } from "./article-viewer"
import { SlideDeckViewer } from "./slide-deck-viewer"
import { VideoViewer } from "./video-viewer"
import { QuizViewer } from "./quiz-viewer"
import { AttestationViewer } from "./attestation-viewer"
import { FormViewer } from "./form-viewer"

interface ContentViewerProps {
  contentItem: any
  onComplete: () => void
  isCompleted: boolean
  isSubmitting: boolean
  enrollmentId: string
  orgSlug: string
  userId: string
}

export function ContentViewer({
  contentItem,
  onComplete,
  isCompleted,
  isSubmitting,
  enrollmentId,
  orgSlug,
  userId,
}: ContentViewerProps) {
  if (!contentItem) {
    return <div>Content not found</div>
  }

  const renderContent = () => {
    switch (contentItem.type) {
      case "ARTICLE":
        return (
          <ArticleViewer
            article={contentItem.article}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      case "SLIDE_DECK":
        return (
          <SlideDeckViewer
            slideDeck={contentItem.slideDeck}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      case "VIDEO":
        return (
          <VideoViewer
            video={contentItem.video}
            onComplete={onComplete}
            isCompleted={isCompleted}
          />
        )
      case "QUIZ":
        return (
          <QuizViewer
            quiz={contentItem.quiz}
            enrollmentId={enrollmentId}
            orgSlug={orgSlug}
            userId={userId}
            onComplete={onComplete}
            isCompleted={isCompleted}
            isSubmitting={isSubmitting}
          />
        )
      case "ATTESTATION":
        return (
          <AttestationViewer
            attestation={contentItem.attestationTemplate}
            enrollmentId={enrollmentId}
            orgSlug={orgSlug}
            userId={userId}
            onComplete={onComplete}
            isCompleted={isCompleted}
            isSubmitting={isSubmitting}
          />
        )
      case "FORM":
        return (
          <FormViewer
            formTemplate={contentItem.formTemplate}
            enrollmentId={enrollmentId}
            orgSlug={orgSlug}
            userId={userId}
            onComplete={onComplete}
            isCompleted={isCompleted}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return <div>Unsupported content type</div>
    }
  }

  return <div className="space-y-4">{renderContent()}</div>
}
