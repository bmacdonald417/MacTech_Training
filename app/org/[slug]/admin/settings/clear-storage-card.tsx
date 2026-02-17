"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trash2 } from "lucide-react"

interface ClearStorageCardProps {
  orgSlug: string
}

export function ClearStorageCard({ orgSlug }: ClearStorageCardProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    slideImagesWiped: boolean
    slideImagesError?: string
    orphanedStoredDeleted: number
    orphanedStoredErrors: string[]
    orphanedNarrationDeleted: number
    orphanedNarrationErrors: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClear = async () => {
    if (loading) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch(`/api/org/${orgSlug}/admin/storage/clear`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Request failed")
        return
      }
      setResult(data)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage cleanup</CardTitle>
        <CardDescription>
          Free disk space on the server. Wipes generated slide images (they regenerate when viewed) and removes files that are no longer linked to any content (e.g. after deleting items in the GUI). Does not delete content that is still in use.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {loading ? "Clearing…" : "Clear storage cache & orphaned files"}
        </Button>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {result && (
          <div className="rounded-md border bg-muted/50 p-3 text-sm">
            <p className="font-medium text-muted-foreground">Result</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Slide images cache: {result.slideImagesWiped ? "wiped" : "—"}
                {result.slideImagesError && ` (${result.slideImagesError})`}
              </li>
              <li>Orphaned stored files removed: {result.orphanedStoredDeleted}</li>
              <li>Orphaned narration files removed: {result.orphanedNarrationDeleted}</li>
            </ul>
            {(result.orphanedStoredErrors.length > 0 || result.orphanedNarrationErrors.length > 0) && (
              <p className="mt-2 text-amber-600 dark:text-amber-500">
                Some files could not be deleted (see server logs).
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
