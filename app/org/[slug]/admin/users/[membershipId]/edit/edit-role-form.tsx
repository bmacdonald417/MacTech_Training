"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { updateMemberRole } from "../../actions"

const ROLES = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Site Admin" },
] as const

interface EditRoleFormProps {
  orgSlug: string
  membershipId: string
  currentRole: string
}

/** Map legacy roles to current (USER | ADMIN). */
function normalizeRoleForDisplay(role: string): "USER" | "ADMIN" {
  if (role === "ADMIN") return "ADMIN"
  return "USER"
}

export function EditRoleForm({ orgSlug, membershipId, currentRole }: EditRoleFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const displayRole = normalizeRoleForDisplay(currentRole)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const role = (formData.get("role") as string) || "USER"

    const result = await updateMemberRole(orgSlug, membershipId, role)
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.push(`/org/${orgSlug}/admin/users`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200/80 bg-red-50/70 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue={displayRole}
          disabled={pending}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save role"}
        </Button>
        <Button type="button" variant="outline" asChild disabled={pending}>
          <Link href={`/org/${orgSlug}/admin/users`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
