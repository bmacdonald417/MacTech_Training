"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AttestationViewerProps {
  attestation: any
  enrollmentId: string
  orgSlug: string
  userId: string
  onComplete: () => void
  isCompleted: boolean
  isSubmitting: boolean
}

export function AttestationViewer({
  attestation,
  enrollmentId,
  orgSlug,
  userId,
  onComplete,
  isCompleted,
  isSubmitting,
}: AttestationViewerProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [signature, setSignature] = useState("")

  if (!attestation) {
    return <div>Attestation not found</div>
  }

  const handleSubmit = async () => {
    const requiresName = attestation.requireTypedName !== false // default true
    if (!acknowledged || (requiresName && !signature.trim())) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/org/${orgSlug}/attestations/${attestation.id}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typedName: requiresName ? signature.trim() : null,
            enrollmentId,
            userId,
          }),
        }
      )

      if (response.ok) {
        onComplete()
      }
    } catch (error) {
      console.error("Error signing attestation:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="prose max-w-none mb-6">
            <p className="whitespace-pre-line">{attestation.text}</p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                disabled={isCompleted}
                className="w-4 h-4"
              />
              <span>I acknowledge and agree to the above statement</span>
            </label>

            {attestation.requireTypedName !== false && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Signature (Type your full name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  disabled={isCompleted}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            )}

            {!isCompleted && (
              <Button
                onClick={handleSubmit}
                disabled={
                  !acknowledged ||
                  (attestation.requireTypedName !== false && !signature.trim()) ||
                  isSubmitting
                }
                className="w-full"
              >
                {isSubmitting ? "Submitting..." : "Sign and Complete"}
              </Button>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600 pt-4 border-t">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Attestation signed and completed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
