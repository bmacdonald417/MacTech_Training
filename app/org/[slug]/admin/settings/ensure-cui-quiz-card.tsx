"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardCheck, Loader2 } from "lucide-react"

interface EnsureCuiQuizCardProps {
  orgSlug: string
}

export function EnsureCuiQuizCard({ orgSlug }: EnsureCuiQuizCardProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleEnsure() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/org/${orgSlug}/admin/ensure-cui-quiz`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: "error", text: data.message ?? data.error ?? "Request failed." })
        return
      }
      setMessage({
        type: "success",
        text: data.updated
          ? "Quiz step added. Users will now see the 20-question knowledge check when they take CUI Enclave Required User Training."
          : data.message ?? "Done.",
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
          <ClipboardCheck className="h-5 w-5 text-primary" />
          CUI Enclave training — show quiz
        </CardTitle>
        <CardDescription>
          If users don’t see the 20-question knowledge check when taking CUI Enclave Required User
          Training, add the quiz step to the curriculum.
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
        <Button variant="outline" onClick={handleEnsure} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking…
            </>
          ) : (
            "Add quiz to CUI Enclave curriculum"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
