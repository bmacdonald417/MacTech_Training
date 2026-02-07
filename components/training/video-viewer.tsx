"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

interface VideoViewerProps {
  video: any
  onComplete: () => void
  isCompleted: boolean
}

export function VideoViewer({
  video,
  onComplete,
  isCompleted,
}: VideoViewerProps) {
  if (!video) {
    return <div>Video not found</div>
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={video.url}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
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
