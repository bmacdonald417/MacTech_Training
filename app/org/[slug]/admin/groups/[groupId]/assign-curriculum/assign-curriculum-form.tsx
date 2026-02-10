"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { assignCurriculumToGroup } from "../../actions"

interface CurriculumOption {
  id: string
  title: string
}

interface AssignCurriculumFormProps {
  orgSlug: string
  groupId: string
  groupName: string
  curricula: CurriculumOption[]
}

export function AssignCurriculumForm({
  orgSlug,
  groupId,
  groupName,
  curricula,
}: AssignCurriculumFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const groupsUrl = `/org/${orgSlug}/admin/groups`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const curriculumId = (formData.get("curriculumId") as string)?.trim()
    const title = (formData.get("title") as string)?.trim()
    const dueDate = (formData.get("dueDate") as string)?.trim() || undefined

    if (!curriculumId) {
      setError("Please select a curriculum.")
      setPending(false)
      return
    }

    const result = await assignCurriculumToGroup(orgSlug, groupId, curriculumId, title || "", dueDate)
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    const count = result.enrolledCount ?? 0
    const message =
      count > 0
        ? `Assigned to ${count} member${count === 1 ? "" : "s"}. They will see it in My Training (refresh the page if already open).`
        : "Assignment created, but this group has no members yet. Add users to the group under Users; they will see the curriculum in My Training after you assign again or you can assign this same curriculum again after adding members."
    setSuccess(message)
    setTimeout(() => {
      router.push(groupsUrl)
      router.refresh()
    }, 2000)
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-5">
        <Button variant="ghost" size="icon" asChild className="-ml-1">
          <Link href={groupsUrl}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Assign curriculum to group
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Assign a curriculum to <strong>{groupName}</strong>. Every member will get the full curriculum (all modules).
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Curriculum</CardTitle>
          <CardDescription>
            Choose a curriculum. Each user in the group will be enrolled and can complete all modules in order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200/80 bg-red-50/70 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                role="status"
                className="rounded-lg border border-green-200/80 bg-green-50/70 px-4 py-3 text-sm text-green-800"
              >
                {success}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="curriculumId">Curriculum</Label>
              <select
                id="curriculumId"
                name="curriculumId"
                required
                disabled={pending}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground transition-[border-color,box-shadow] duration-150 hover:border-input/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a curriculum</option>
                {curricula.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
                {curricula.length === 0 && (
                  <option value="" disabled>
                    No curricula yet — create one in Curricula first
                  </option>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Assignment title (optional)</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Q4 Safety Training (defaults to curriculum title)"
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date (optional)</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                disabled={pending}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={pending || curricula.length === 0}>
                {pending ? "Assigning…" : "Assign to group"}
              </Button>
              <Button type="button" variant="outline" asChild disabled={pending}>
                <Link href={groupsUrl}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
