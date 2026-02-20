"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2 } from "lucide-react"
import { selfEnrollInAssignment } from "@/app/org/[slug]/dashboard/actions"

interface AvailableAssignment {
  id: string
  title: string
  description: string | null
  type: "CURRICULUM" | "CONTENT_ITEM"
  curriculumTitle?: string | null
}

interface AvailableTrainingCardProps {
  orgSlug: string
  assignments: AvailableAssignment[]
  isWelcome?: boolean
}

export function AvailableTrainingCard({
  orgSlug,
  assignments,
  isWelcome = false,
}: AvailableTrainingCardProps) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)

  if (assignments.length === 0) return null

  const handleStart = async (assignmentId: string) => {
    setPendingId(assignmentId)
    try {
      const result = await selfEnrollInAssignment(orgSlug, assignmentId)
      if (result.error) {
        console.error(result.error)
        setPendingId(null)
        return
      }
      if (result.enrollmentId) {
        router.push(`/org/${orgSlug}/training/${result.enrollmentId}`)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
      setPendingId(null)
    }
  }

  // Prefer CUI Enclave for welcome / first
  const sorted = [...assignments].sort((a, b) => {
    const aCui = a.title.toLowerCase().includes("cui enclave") ? -1 : 0
    const bCui = b.title.toLowerCase().includes("cui enclave") ? -1 : 0
    return aCui - bCui
  })

  const primary = sorted[0]

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5" />
          {isWelcome ? "Get started" : "Available training"}
        </CardTitle>
        <CardDescription>
          {isWelcome
            ? "Start your required training. Includes slides, knowledge check quiz, and attestation."
            : "Training assigned to your group. Start to add it to My Training."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((a) => (
          <div
            key={a.id}
            className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{a.title}</p>
              {a.description && (
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{a.description}</p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => handleStart(a.id)}
              disabled={pendingId !== null}
              className="shrink-0"
            >
              {pendingId === a.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Start"
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
