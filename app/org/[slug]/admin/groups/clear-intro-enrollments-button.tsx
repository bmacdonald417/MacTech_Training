"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { clearIntroGroupEnrollments } from "./actions"
import { RefreshCw } from "lucide-react"

interface ClearIntroEnrollmentsButtonProps {
  orgSlug: string
}

export function ClearIntroEnrollmentsButton({ orgSlug }: ClearIntroEnrollmentsButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleClick() {
    if (
      !confirm(
        "Remove all existing enrollments for intro group assignments? Intro members will then see those courses on the dashboard as \"Get started\" and can self-assign. This does not remove the assignments from the group."
      )
    ) {
      return
    }
    setPending(true)
    setMessage(null)
    try {
      const result = await clearIntroGroupEnrollments(orgSlug)
      if (result.error) {
        setMessage(result.error)
      } else {
        setMessage(
          result.clearedCount === 0
            ? "Intro group has no enrollments to clear. Courses are already available for self-assign."
            : `Cleared ${result.clearedCount} enrollment(s). Intro members will see courses on the dashboard as available for self-assign.`
        )
      }
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={pending}
        className="gap-1.5"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Resetting…" : "Reset to self-assign only"}
      </Button>
      {message && (
        <p className="text-xs text-muted-foreground max-w-[240px]">{message}</p>
      )}
    </div>
  )
}
