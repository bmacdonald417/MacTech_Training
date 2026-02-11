"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Loader2, RefreshCw, Play, Pause } from "lucide-react"

interface NarrationPlayerProps {
  orgSlug: string
  entityType: "SLIDE" | "ARTICLE"
  entityId: string
  canGenerate: boolean
  /** When true, show explicit Play, Pause, Mute, Volume controls instead of only native audio bar */
  showMediaControls?: boolean
}

export function NarrationPlayer({
  orgSlug,
  entityType,
  entityId,
  canGenerate,
  showMediaControls = false,
}: NarrationPlayerProps) {
  const [hasNarration, setHasNarration] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/org/${orgSlug}/narration?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`
      )
      let data: { hasNarration?: boolean; streamUrl?: string } = {}
      try {
        data = await res.json()
      } catch {
        data = {}
      }
      if (res.ok && data.hasNarration && data.streamUrl) {
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
  }, [orgSlug, entityType, entityId])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

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
          {showMediaControls ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => {
                  audioRef.current?.play()
                  setPlaying(true)
                }}
              >
                <Play className="h-3.5 w-3.5" />
                Play
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => {
                  audioRef.current?.pause()
                  setPlaying(false)
                }}
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.muted = !audioRef.current.muted
                    setMuted(audioRef.current.muted)
                  }
                }}
              >
                {muted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {muted ? "Unmute" : "Mute"}
              </Button>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Volume2 className="h-3.5 w-3.5" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume * 100}
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100
                    setVolume(v)
                    if (audioRef.current) audioRef.current.volume = v
                  }}
                  className="w-24 h-2 accent-primary"
                  title="Volume"
                />
              </label>
              <audio
                ref={audioRef}
                className="sr-only"
                src={streamUrl}
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            </div>
          ) : (
            <audio
              ref={audioRef}
              controls
              className="w-full h-9"
              src={streamUrl}
              preload="metadata"
            />
          )}
        </div>
      )}
    </div>
  )
}
