"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ensureGroupJoinCode } from "./actions"

interface GroupJoinCodeGenerateButtonProps {
  groupId: string
  orgSlug: string
}

export function GroupJoinCodeGenerateButton({ groupId, orgSlug }: GroupJoinCodeGenerateButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleGenerate() {
    setPending(true)
    const result = await ensureGroupJoinCode(orgSlug, groupId)
    setPending(false)
    if (result.success) router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleGenerate} disabled={pending}>
      {pending ? "Generating…" : "Generate join link & QR code"}
    </Button>
  )
}
