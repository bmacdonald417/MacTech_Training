"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { removeAssignmentFromGroup } from "./actions"

export function RemoveGroupAssignmentButton({
  orgSlug,
  assignmentId,
  curriculumTitle,
}: {
  orgSlug: string
  assignmentId: string
  curriculumTitle: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleRemove() {
    if (!confirm(`Remove "${curriculumTitle}" from this group? Members will no longer see it in My Training.`)) return
    setPending(true)
    const result = await removeAssignmentFromGroup(orgSlug, assignmentId)
    setPending(false)
    if (result.error) {
      alert(result.error)
      return
    }
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
      onClick={handleRemove}
      disabled={pending}
      title="Remove training from group"
      aria-label={`Remove ${curriculumTitle} from group`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
