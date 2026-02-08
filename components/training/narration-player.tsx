"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, Loader2, RefreshCw } from "lucide-react"

interface NarrationPlayerProps {
  orgSlug: string
  entityType: "SLIDE" | "ARTICLE"
  entityId: string
  canGenerate: boolean
}

export function NarrationPlayer({
  orgSlug,
  entityType,
  entityId,
  canGenerate,
}: NarrationPlayerProps) {
  const [hasNarration, setHasNarration] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const fetchStatus = async () => {
    try {
      const res = await fetch(
        `/api/org/${orgSlug}/narration?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`
      )
      const data = await res.json()
      if (data.hasNarration && data.streamUrl) {
        setHasNarration(true)
        setStreamUrl(data.streamUrl)
      } else {
        setHasNarration(false)
        setStreamUrl(null)
      }
    } catch {
      setHasNarration(false)
      setStreamUrl(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [orgSlug, entityType, entityId])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch(`/api/org/${orgSlug}/tts/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId }),
      })
      let data: { ok?: boolean; streamUrl?: string; error?: string } = {}
      try {
        data = await res.json()
      } catch {
        data = { error: "Request failed. Please try again." }
      }
      if (res.ok && data.ok && data.streamUrl) {
        setHasNarration(true)
        setStreamUrl(data.streamUrl)
        setGenerateError(null)
        if (audioRef.current) {
          audioRef.current.src = data.streamUrl
          audioRef.current.load()
        }
      } else {
        setGenerateError(
          data.error || (res.status === 503 ? "Narration service is not configured. Ask your admin to set OPENAI_API_KEY." : "Generation failed. Please try again.")
        )
      }
    } catch {
      setGenerateError("Network error. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking narration…</span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      {!hasNarration && (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            Narration not available yet.
          </p>
          {canGenerate && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate narration
                  </>
                )}
              </Button>
              {generateError && (
                <p className="text-sm text-amber-600 dark:text-amber-500 mt-2">
                  {generateError}
                </p>
              )}
            </>
          )}
        </>
      )}
      {hasNarration && streamUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Listen</span>
            {canGenerate && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-8 text-xs"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Regenerate"
                )}
              </Button>
            )}
          </div>
          <audio
            ref={audioRef}
            controls
            className="w-full h-9"
            src={streamUrl}
            preload="metadata"
          />
        </div>
      )}
    </div>
  )
}
