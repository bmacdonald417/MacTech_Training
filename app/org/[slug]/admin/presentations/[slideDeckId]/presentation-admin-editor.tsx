"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { updateSlideNotesRichText } from "../actions"
import { ExternalLink, Loader2, RefreshCw, Wand2, Volume2, RotateCcw } from "lucide-react"

type SlideRow = {
  id: string
  order: number
  title: string
  notesRichText: string | null
  defaultScript: string
  narration: { updatedAt: string; voice: string; inputText: string | null } | null
}

const VOICES = [
  { value: "alloy", label: "Alloy (default)" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" },
  { value: "echo", label: "Echo" },
  { value: "onyx", label: "Onyx" },
  { value: "fable", label: "Fable" },
] as const

export function PresentationAdminEditor({
  orgSlug,
  slideDeckId,
  title,
  sourceFileId,
  slides,
}: {
  orgSlug: string
  slideDeckId: string
  title: string
  sourceFileId: string | null
  slides: SlideRow[]
}) {
  const [selectedId, setSelectedId] = useState<string>(slides[0]?.id ?? "")
  const selectedIndex = useMemo(
    () => Math.max(0, slides.findIndex((s) => s.id === selectedId)),
    [selectedId, slides],
  )
  const selected = slides[selectedIndex]

  const [notes, setNotes] = useState(selected?.notesRichText ?? "")
  const [scriptBySlideId, setScriptBySlideId] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const s of slides) {
      init[s.id] = s.narration?.inputText?.trim() || s.defaultScript
    }
    return init
  })
  const [voice, setVoice] = useState<(typeof VOICES)[number]["value"]>("alloy")
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [generating, setGenerating] = useState(false)
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)

  // Keep textarea in sync when switching slides.
  function selectSlide(id: string) {
    setSelectedId(id)
    const next = slides.find((s) => s.id === id)
    setNotes(next?.notesRichText ?? "")
    setStatus(null)
    setError(null)
    setAudioUrl(null)
  }

  const viewerUrl = useMemo(() => {
    if (!sourceFileId) return null
    return `/org/${orgSlug}/slides/view/${sourceFileId}?from=${encodeURIComponent(
      `/org/${orgSlug}/admin/presentations/${slideDeckId}`,
    )}`
  }, [orgSlug, slideDeckId, sourceFileId])

  async function saveNotes() {
    if (!selected?.id) return
    setError(null)
    setStatus(null)
    startTransition(async () => {
      const res = await updateSlideNotesRichText(orgSlug, slideDeckId, selected.id, notes)
      if ((res as any)?.error) {
        setError((res as any).error)
      } else {
        setStatus("Saved speaker notes.")
      }
    })
  }

  async function generateNarrationForSlide(slideId: string) {
    setGenerating(true)
    setError(null)
    setStatus(null)
    setAudioUrl(null)
    try {
      const inputText = scriptBySlideId[slideId] ?? ""
      const res = await fetch(`/api/org/${orgSlug}/tts/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "SLIDE", entityId: slideId, voice, inputText }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        streamUrl?: string
        error?: string
      }
      if (!res.ok || !data.ok || !data.streamUrl) {
        setError(data.error || "TTS generation failed.")
        return
      }
      setAudioUrl(data.streamUrl)
      setStatus("Narration generated from script.")
    } catch {
      setError("Network error generating narration.")
    } finally {
      setGenerating(false)
    }
  }

  async function bulkGenerate() {
    if (slides.length === 0) return
    setBulkGenerating(true)
    setBulkProgress({ done: 0, total: slides.length })
    setError(null)
    setStatus(null)
    try {
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i]
        const inputText = scriptBySlideId[s.id] ?? s.defaultScript
        const res = await fetch(`/api/org/${orgSlug}/tts/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType: "SLIDE", entityId: s.id, voice, inputText }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({} as any))
          throw new Error(data?.error || `Failed on slide ${i + 1}`)
        }
        setBulkProgress({ done: i + 1, total: slides.length })
      }
      setStatus("Bulk narration generation complete.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk generation failed.")
    } finally {
      setBulkGenerating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-4">
        <CardHeader className="py-4">
          <CardTitle className="text-base">Slides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-muted-foreground">
            {slides.length} slide{slides.length === 1 ? "" : "s"}
          </div>
          <div className="max-h-[520px] overflow-auto rounded-lg border border-border/50">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectSlide(s.id)}
                className={cn(
                  "flex w-full items-center gap-2 border-b border-border/40 px-3 py-2 text-left text-sm transition-colors",
                  selectedId === s.id
                    ? "bg-primary/10 text-foreground"
                    : "bg-background hover:bg-muted/40 text-muted-foreground"
                )}
              >
                <span className="w-10 shrink-0 tabular-nums text-xs text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {s.narration ? "narrated" : s.notesRichText?.trim() ? "notes" : ""}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-8">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">Backdoor settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{title}</span>
              {selected ? (
                <>
                  <span className="mx-2 text-muted-foreground/40">•</span>
                  Slide {selectedIndex + 1}: {selected.title}
                </>
              ) : null}
            </div>

            {viewerUrl && (
              <div>
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link href={viewerUrl} target="_blank" rel="noreferrer">
                    Open viewer <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Voice</Label>
                <select
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as any)}
                  disabled={generating || bulkGenerating}
                >
                  {VOICES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-muted-foreground">
                  Used for the next TTS generation call(s).
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bulk actions</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={bulkGenerate}
                    disabled={bulkGenerating || slides.length === 0}
                    className="gap-2"
                  >
                    {bulkGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    Generate all slide narration
                  </Button>
                </div>
                {bulkProgress && (
                  <div className="text-xs text-muted-foreground">
                    {bulkProgress.done}/{bulkProgress.total}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Speaker notes (saved)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={10}
                placeholder="These notes are included when generating slide narration."
                className="flex min-h-[140px] w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <Button type="button" onClick={saveNotes} disabled={isPending} className="gap-2">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save notes
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Narration script (used for TTS)</Label>
              <textarea
                value={selected?.id ? (scriptBySlideId[selected.id] ?? "") : ""}
                onChange={(e) => {
                  if (!selected?.id) return
                  const v = e.target.value
                  setScriptBySlideId((prev) => ({ ...prev, [selected.id]: v }))
                }}
                rows={8}
                placeholder="This is the exact text sent to the TTS API. Edit it, then regenerate narration."
                className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => selected?.id && generateNarrationForSlide(selected.id)}
                  disabled={generating || !selected?.id}
                  className="gap-2"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {selected?.narration ? "Regenerate narration" : "Generate narration"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (!selected?.id) return
                    const d = selected.defaultScript
                    setScriptBySlideId((prev) => ({ ...prev, [selected.id]: d }))
                    setStatus("Reset script to default.")
                    setError(null)
                  }}
                  disabled={!selected?.id}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset script
                </Button>
                {selected?.narration && (
                  <div className="text-xs text-muted-foreground">
                    Current narration: {new Date(selected.narration.updatedAt).toLocaleString()} • {selected.narration.voice}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Edits here are saved the next time you regenerate (we persist the script with the narration asset).
              </div>
            </div>

            {audioUrl && (
              <div className="space-y-2 rounded-xl border border-border/40 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Preview</span>
                  <span className="text-muted-foreground">({voice})</span>
                </div>
                <audio controls className="w-full h-9" src={audioUrl} preload="metadata" />
              </div>
            )}

            {status && <div className="text-sm text-emerald-500">{status}</div>}
            {error && <div className="text-sm text-destructive">{error}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

