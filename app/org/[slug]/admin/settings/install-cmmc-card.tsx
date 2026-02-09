"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2 } from "lucide-react"

interface InstallCmmcCardProps {
  orgSlug: string
}

export function InstallCmmcCard({ orgSlug }: InstallCmmcCardProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleInstall() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/org/${orgSlug}/admin/seed-cmmc`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Request failed." })
        return
      }
      setMessage({
        type: "success",
        text: data.installed
          ? "CMMC slide deck added. It’s now in Content → Slide decks with your other slide decks."
          : data.message ?? "Already in your content library.",
      })
    } catch {
      setMessage({ type: "error", text: "Network error." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          CMMC Level 2 AT course
        </CardTitle>
        <CardDescription>
          Add the 40-slide CMMC course as a slide deck in your content library. It will appear in
          Content → Slide decks alongside your other slide decks, and in Curricula.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <p
            className={`mb-4 text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}
          >
            {message.text}
          </p>
        )}
        <Button onClick={handleInstall} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Installing…
            </>
          ) : (
            "Add CMMC slide deck to content library"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
