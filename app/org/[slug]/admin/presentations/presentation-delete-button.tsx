"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function PresentationDeleteButton({
  orgSlug,
  slideDeckId,
  title,
}: {
  orgSlug: string
  slideDeckId: string
  title: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This removes the presentation and its slides. This cannot be undone.`)) return
    setPending(true)
    try {
      const res = await fetch(`/api/org/${orgSlug}/slides/deck/${slideDeckId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error ?? "Failed to delete.")
        return
      }
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="shrink-0 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={pending}
      title="Delete presentation"
      aria-label={`Delete ${title}`}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
