"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { createAssignment } from "./actions"

type CurriculumOption = { id: string; title: string }
type ContentItemOption = { id: string; title: string; type: string }

interface NewAssignmentFormProps {
  orgSlug: string
  curricula: CurriculumOption[]
  contentItems: ContentItemOption[]
}

export function NewAssignmentForm({
  orgSlug,
  curricula,
  contentItems,
}: NewAssignmentFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [type, setType] = useState<"CURRICULUM" | "CONTENT_ITEM">("CURRICULUM")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const title = (formData.get("title") as string)?.trim()
    const description = (formData.get("description") as string)?.trim()
    const dueDate = (formData.get("dueDate") as string) || undefined
    const curriculumId = (formData.get("curriculumId") as string) || undefined
    const contentItemId = (formData.get("contentItemId") as string) || undefined

    const result = await createAssignment(orgSlug, {
      type,
      curriculumId: type === "CURRICULUM" ? curriculumId : undefined,
      contentItemId: type === "CONTENT_ITEM" ? contentItemId : undefined,
      title: title || "",
      description: description || undefined,
      dueDate: dueDate || undefined,
    })

    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push(`/org/${orgSlug}/trainer/assignments`)
    router.refresh()
  }

  const basePath = `/org/${orgSlug}/trainer/assignments`

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="flex items-center gap-5">
        <Button type="button" variant="ghost" size="icon" asChild className="-ml-1">
          <Link href={basePath}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Create Assignment
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Assign a curriculum or a single content item to trainees
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200/80 bg-red-50/70 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Assignment details</CardTitle>
          <CardDescription>
            Choose what to assign and give it a title. You can assign to users or groups after creating.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="CURRICULUM"
                  checked={type === "CURRICULUM"}
                  onChange={() => setType("CURRICULUM")}
                  disabled={pending}
                  className="rounded-full border-input"
                />
                <span className="text-sm font-medium">Curriculum</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="CONTENT_ITEM"
                  checked={type === "CONTENT_ITEM"}
                  onChange={() => setType("CONTENT_ITEM")}
                  disabled={pending}
                  className="rounded-full border-input"
                />
                <span className="text-sm font-medium">Single content item</span>
              </label>
            </div>
          </div>

          {type === "CURRICULUM" && (
            <div className="space-y-2">
              <Label htmlFor="curriculumId">Curriculum</Label>
              <select
                id="curriculumId"
                name="curriculumId"
                required={type === "CURRICULUM"}
                disabled={pending}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm transition-[border-color,box-shadow] duration-150 hover:border-input/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a curriculum</option>
                {curricula.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
                {curricula.length === 0 && (
                  <option value="" disabled>
                    No curricula yet — create one first
                  </option>
                )}
              </select>
            </div>
          )}

          {type === "CONTENT_ITEM" && (
            <div className="space-y-2">
              <Label htmlFor="contentItemId">Content item</Label>
              <select
                id="contentItemId"
                name="contentItemId"
                required={type === "CONTENT_ITEM"}
                disabled={pending}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm transition-[border-color,box-shadow] duration-150 hover:border-input/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select content from library</option>
                {contentItems.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.type.replace("_", " ")})
                  </option>
                ))}
                {contentItems.length === 0 && (
                  <option value="" disabled>
                    No content in library — add content first
                  </option>
                )}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Assignment title</Label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Q4 Safety Training"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              type="text"
              placeholder="Instructions or notes"
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
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create assignment"}
            </Button>
            <Button type="button" variant="outline" asChild disabled={pending}>
              <Link href={basePath}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
