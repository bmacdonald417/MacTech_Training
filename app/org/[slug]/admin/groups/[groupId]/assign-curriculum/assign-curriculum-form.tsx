"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, BookOpen, Trash2 } from "lucide-react"
import { assignCurriculumToGroup, assignContentItemToGroup, wipeCurriculaForOrg } from "../../actions"

interface CurriculumOption {
  id: string
  title: string
}

interface AssignCurriculumFormProps {
  orgSlug: string
  groupId: string
  groupName: string
  curricula: CurriculumOption[]
  slideDecks: CurriculumOption[]
}

export function AssignCurriculumForm({
  orgSlug,
  groupId,
  groupName,
  curricula,
  slideDecks,
}: AssignCurriculumFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [wipePending, setWipePending] = useState(false)

  const groupsUrl = `/org/${orgSlug}/admin/groups`

  async function handleWipe() {
    if (!confirm("Remove all curricula and their group assignments? This cannot be undone.")) return
    setWipePending(true)
    setError(null)
    const result = await wipeCurriculaForOrg(orgSlug)
    setWipePending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess(`Removed ${result.wiped ?? 0} curricula. You can now assign slide decks below.`)
    router.refresh()
  }

  async function handleCurriculumSubmit(e: React.FormEvent<HTMLFormElement>) {
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

  async function handleSlideDeckSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const contentItemId = (formData.get("contentItemId") as string)?.trim()
    const deckTitle = (formData.get("deckTitle") as string)?.trim()
    const deckDueDate = (formData.get("deckDueDate") as string)?.trim() || undefined

    if (!contentItemId) {
      setError("Please select a slide deck.")
      setPending(false)
      return
    }

    const result = await assignContentItemToGroup(
      orgSlug,
      groupId,
      contentItemId,
      deckTitle || "",
      deckDueDate
    )
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    const count = result.enrolledCount ?? 0
    const message =
      count > 0
        ? `Slide deck assigned to ${count} member${count === 1 ? "" : "s"}. They will see it in My Training.`
        : "Assignment created; add users to the group to see it in My Training."
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

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200/80 bg-red-50/70 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200/80 bg-green-50/70 px-4 py-3 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-200"
        >
          {success}
        </div>
      )}

      {/* Slide decks from Admin > Presentations — assign directly to group */}
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Assign slide deck (presentation)
          </CardTitle>
          <CardDescription>
            Choose a slide deck uploaded in Admin → Presentations. Each member will see it in My Training with slide images and narrator audio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSlideDeckSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contentItemId">Slide deck</Label>
              <select
                id="contentItemId"
                name="contentItemId"
                required
                disabled={pending}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground transition-[border-color,box-shadow] duration-150 hover:border-input/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a slide deck</option>
                {slideDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
                {slideDecks.length === 0 && (
                  <option value="" disabled>
                    No slide decks — upload .pptx in Admin → Presentations first
                  </option>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deckTitle">Assignment title (optional)</Label>
              <Input
                id="deckTitle"
                name="deckTitle"
                type="text"
                placeholder="Defaults to deck title"
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deckDueDate">Due date (optional)</Label>
              <Input
                id="deckDueDate"
                name="deckDueDate"
                type="date"
                disabled={pending}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={pending || slideDecks.length === 0}>
                {pending ? "Assigning…" : "Assign slide deck to group"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Curricula (create in Trainer → Curricula); optional wipe */}
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Assign curriculum</CardTitle>
              <CardDescription>
                Choose a curriculum (multi-module). Or clear broken/duplicate entries below and use slide decks above.
              </CardDescription>
            </div>
            {curricula.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleWipe}
                disabled={wipePending || pending}
                className="shrink-0 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {wipePending ? "Wiping…" : "Wipe all curricula"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCurriculumSubmit} className="space-y-6">
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
                    No curricula — use slide decks above or create one in Trainer → Curricula
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
                {pending ? "Assigning…" : "Assign curriculum to group"}
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
