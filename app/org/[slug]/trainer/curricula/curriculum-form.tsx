"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"
import { createCurriculum, updateCurriculum, type SectionInput } from "./actions"

export type ContentItemOption = { id: string; title: string; type: string }

type CurriculumFormProps = {
  orgSlug: string
  contentItems: ContentItemOption[]
  mode: "create" | "edit"
  curriculumId?: string
  initialTitle?: string
  initialDescription?: string
  initialSections?: SectionInput[]
}

export function CurriculumForm({
  orgSlug,
  contentItems,
  mode,
  curriculumId,
  initialTitle = "",
  initialDescription = "",
  initialSections = [{ title: "", description: "", contentItemIds: [] }],
}: CurriculumFormProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [sections, setSections] = useState<SectionInput[]>(
    initialSections.length > 0 ? initialSections : [{ title: "", description: "", contentItemIds: [] }]
  )

  function addSection() {
    setSections((s) => [...s, { title: "", description: "", contentItemIds: [] }])
  }

  function removeSection(index: number) {
    setSections((s) => s.filter((_, i) => i !== index))
  }

  function updateSection(index: number, updates: Partial<SectionInput>) {
    setSections((s) =>
      s.map((sec, i) => (i === index ? { ...sec, ...updates } : sec))
    )
  }

  function addContentToSection(sectionIndex: number, contentItemId: string) {
    setSections((s) =>
      s.map((sec, i) => {
        if (i !== sectionIndex) return sec
        if (sec.contentItemIds.includes(contentItemId)) return sec
        return { ...sec, contentItemIds: [...sec.contentItemIds, contentItemId] }
      })
    )
  }

  function removeContentFromSection(sectionIndex: number, contentItemId: string) {
    setSections((s) =>
      s.map((sec, i) =>
        i === sectionIndex
          ? { ...sec, contentItemIds: sec.contentItemIds.filter((id) => id !== contentItemId) }
          : sec
      )
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setPending(true)

    const result =
      mode === "create"
        ? await createCurriculum(orgSlug, { title, description, sections })
        : await updateCurriculum(orgSlug, curriculumId!, { title, description, sections })

    setPending(false)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
      return
    }
    if (mode === "create" && "curriculumId" in result && result.curriculumId) {
      router.push(`/org/${orgSlug}/trainer/curricula/${result.curriculumId}`)
      router.refresh()
      return
    }
    if (mode === "edit") {
      setMessage({ type: "success", text: "Curriculum saved." })
      router.refresh()
    }
  }

  const basePath = `/org/${orgSlug}/trainer/curricula`

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="flex items-center gap-5">
        <Button type="button" variant="ghost" size="icon" asChild className="-ml-1">
          <Link href={mode === "edit" ? `${basePath}/${curriculumId}` : basePath}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === "create" ? "Create curriculum" : "Edit curriculum"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "create"
              ? "Add sections and attach content from the library."
              : "Update sections and library modules."}
          </p>
        </div>
      </div>

      {message && (
        <div
          role="alert"
          className={
            message.type === "error"
              ? "rounded-lg border border-red-200/80 bg-red-50/70 px-4 py-3 text-sm text-red-700"
              : "rounded-lg border border-green-200/80 bg-green-50/70 px-4 py-3 text-sm text-green-700"
          }
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Title and description for this curriculum</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Onboarding 2024"
              disabled={pending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              disabled={pending}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sections & modules</h2>
            <p className="text-sm text-muted-foreground">
              Add sections and attach content from the library to each section
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSection} disabled={pending}>
            <Plus className="h-4 w-4 mr-2" />
            Add section
          </Button>
        </div>

        {sections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Section {sectionIndex + 1}</CardTitle>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(sectionIndex)}
                  disabled={pending || sections.length <= 1}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Section title</Label>
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                  placeholder="e.g. Week 1: Introduction"
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label>Section description (optional)</Label>
                <Input
                  value={section.description || ""}
                  onChange={(e) => updateSection(sectionIndex, { description: e.target.value })}
                  placeholder="Optional description"
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label>Library modules in this section</Label>
                <div className="flex flex-wrap gap-2">
                  {section.contentItemIds.map((id) => {
                    const item = contentItems.find((c) => c.id === id)
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        {item?.title ?? id}
                        <button
                          type="button"
                          onClick={() => removeContentFromSection(sectionIndex, id)}
                          disabled={pending}
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )
                  })}
                </div>
                <select
                  className="mt-1 flex h-10 w-full max-w-xs rounded-lg border border-input bg-background px-3.5 py-2 text-sm transition-[border-color,box-shadow] duration-150 hover:border-input/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  value=""
                  onChange={(e) => {
                    const id = e.target.value
                    if (id) {
                      addContentToSection(sectionIndex, id)
                      e.target.value = ""
                    }
                  }}
                  disabled={pending}
                >
                  <option value="">Add from library…</option>
                  {contentItems
                    .filter((c) => !section.contentItemIds.includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.type.replace("_", " ")})
                      </option>
                    ))}
                  {contentItems.filter((c) => !section.contentItemIds.includes(c.id)).length === 0 && (
                    <option value="" disabled>
                      No more items in library
                    </option>
                  )}
                </select>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : mode === "create" ? "Create curriculum" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" asChild disabled={pending}>
            <Link href={mode === "edit" && curriculumId ? `${basePath}/${curriculumId}` : basePath}>
              Cancel
            </Link>
          </Button>
        </div>
      </div>
    </form>
  )
}
