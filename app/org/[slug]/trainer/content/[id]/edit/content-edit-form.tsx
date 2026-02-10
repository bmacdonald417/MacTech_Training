"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateContent, type SlideInput, type FormFieldInput, type QuizQuestionInput } from "../../actions"
import { cn } from "@/lib/utils"
import { Plus, Trash2, ChevronUp, ChevronDown, FileDown, FileUp, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const SLIDE_LAYOUTS = [
  { value: "TITLE", label: "Title only" },
  { value: "TITLE_AND_BODY", label: "Title and body" },
  { value: "TWO_COLUMN", label: "Two column" },
  { value: "IMAGE_LEFT_TEXT_RIGHT", label: "Image left, text right" },
] as const

type SlideDeckWithSlides = {
  id: string
  slides: {
    id: string
    title: string
    content: string
    order: number
    layoutType?: string | null
    notesRichText?: string | null
  }[]
}
type QuizWithQuestions = {
  id: string
  passingScore: number
  allowRetry: boolean
  showAnswersAfter: boolean
  questions: {
    id: string
    text: string
    type: string
    explanation: string | null
    order: number
    choices: { id: string; text: string; isCorrect: boolean; order: number }[]
  }[]
}

interface ContentEditFormProps {
  orgSlug: string
  contentItem: {
    id: string
    type: string
    title: string
    description: string | null
    video?: { url: string; duration: number | null } | null
    article?: { content: string } | null
    attestationTemplate?: { text: string } | null
    slideDeck?: SlideDeckWithSlides | null
    formTemplate?: { id: string; schemaJson: string } | null
    quiz?: QuizWithQuestions | null
  }
}

const FORM_FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
] as const

export function ContentEditForm({ orgSlug, contentItem }: ContentEditFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(contentItem.title)
  const [description, setDescription] = useState(contentItem.description ?? "")
  const [videoUrl, setVideoUrl] = useState(contentItem.video?.url ?? "")
  const [videoDuration, setVideoDuration] = useState(
    contentItem.video?.duration != null ? String(contentItem.video.duration) : ""
  )
  const [articleContent, setArticleContent] = useState(contentItem.article?.content ?? "")
  const [attestationText, setAttestationText] = useState(
    contentItem.attestationTemplate?.text ?? "I acknowledge the above."
  )

  const initialSlides: SlideInput[] =
    contentItem.slideDeck?.slides.map((s) => ({
      title: s.title,
      content: s.content,
      order: s.order,
      layoutType: s.layoutType ?? null,
      notesRichText: s.notesRichText ?? null,
    })) ?? []
  const [slides, setSlides] = useState<SlideInput[]>(
    initialSlides.length > 0 ? initialSlides : [{ title: "Slide 1", content: "", order: 1, layoutType: "TITLE_AND_BODY", notesRichText: null }]
  )
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [editSlideIndex, setEditSlideIndex] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)

  let parsedForm: FormFieldInput[] = []
  try {
    const raw = JSON.parse(contentItem.formTemplate?.schemaJson ?? "[]")
    parsedForm = Array.isArray(raw) ? raw : []
  } catch {
    parsedForm = []
  }
  const [formFields, setFormFields] = useState<FormFieldInput[]>(
    parsedForm.length > 0 ? parsedForm : [{ id: "field_1", type: "text", label: "Field 1", required: false }]
  )

  const [quizPassingScore, setQuizPassingScore] = useState(
    contentItem.quiz?.passingScore ?? 70
  )
  const [quizAllowRetry, setQuizAllowRetry] = useState(contentItem.quiz?.allowRetry ?? false)
  const [quizShowAnswersAfter, setQuizShowAnswersAfter] = useState(
    contentItem.quiz?.showAnswersAfter ?? true
  )
  const initialQuestions: QuizQuestionInput[] =
    contentItem.quiz?.questions.map((q) => ({
      text: q.text,
      type: q.type,
      explanation: q.explanation ?? "",
      order: q.order,
      choices: q.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect, order: c.order })),
    })) ?? []
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionInput[]>(
    initialQuestions.length > 0 ? initialQuestions : [
      { text: "Question 1", type: "MULTIPLE_CHOICE", explanation: "", order: 1, choices: [{ text: "Option A", isCorrect: false, order: 1 }, { text: "Option B", isCorrect: true, order: 2 }] },
    ]
  )

  function addSlide() {
    setSlides((prev) => [
      ...prev,
      { title: `Slide ${prev.length + 1}`, content: "", order: prev.length + 1, layoutType: "TITLE_AND_BODY", notesRichText: null },
    ])
  }

  async function processPptxFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pptx")) {
      setError("Invalid file type. Please upload a .pptx file.")
      return
    }
    setImporting(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      if (contentItem.type === "SLIDE_DECK" && contentItem.slideDeck?.id && contentItem.id) {
        formData.append("contentItemId", contentItem.id)
        formData.append("slideDeckId", contentItem.slideDeck.id)
      }
      const res = await fetch(`/api/org/${orgSlug}/slides/import-pptx`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Import failed. Check file format and try again.")
        return
      }
      const slideList = Array.isArray(data.slides) ? data.slides : []
      if (slideList.length > 0) {
        setSlides(
          slideList.map((s: { title?: string; content?: string; order?: number; layoutType?: string; notesRichText?: string | null }, i: number) => ({
            title: s.title ?? `Slide ${i + 1}`,
            content: s.content ?? "",
            order: i + 1,
            layoutType: s.layoutType ?? "TITLE_AND_BODY",
            notesRichText: s.notesRichText ?? null,
          }))
        )
      }
      if (data.redirectUrl) {
        router.push(data.redirectUrl)
        router.refresh()
      }
    } catch {
      setError("Import failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  function handleImportPptx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processPptxFile(file)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processPptxFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave() {
    setDragActive(false)
  }

  async function handleExportPptx() {
    const slideDeckId = contentItem.slideDeck?.id
    if (!slideDeckId) {
      setError("No slide deck to export")
      return
    }
    setExporting(true)
    try {
      const res = await fetch(
        `/api/org/${orgSlug}/slides/export-pptx?slideDeckId=${encodeURIComponent(slideDeckId)}`
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Export failed")
        return
      }
      const blob = await res.blob()
      const disp = res.headers.get("Content-Disposition")
      const match = disp?.match(/filename="?([^";\n]+)"?/)
      const filename = match?.[1]?.trim() || "export.pptx"
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Export failed")
    } finally {
      setExporting(false)
    }
  }
  function removeSlide(i: number) {
    setSlides((prev) => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })))
  }
  function moveSlide(i: number, dir: number) {
    const j = i + dir
    if (j < 0 || j >= slides.length) return
    setSlides((prev) => {
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next.map((s, idx) => ({ ...s, order: idx + 1 }))
    })
  }

  function addFormField() {
    setFormFields((prev) => [
      ...prev,
      { id: `field_${Date.now()}`, type: "text", label: `Field ${prev.length + 1}`, required: false },
    ])
  }
  function removeFormField(i: number) {
    setFormFields((prev) => prev.filter((_, idx) => idx !== i))
  }

  function addQuizQuestion() {
    setQuizQuestions((prev) => [
      ...prev,
      {
        text: `Question ${prev.length + 1}`,
        type: "MULTIPLE_CHOICE",
        explanation: "",
        order: prev.length + 1,
        choices: [
          { text: "Option A", isCorrect: false, order: 1 },
          { text: "Option B", isCorrect: true, order: 2 },
        ],
      },
    ])
  }
  function removeQuizQuestion(i: number) {
    setQuizQuestions((prev) => prev.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx + 1 })))
  }
  function addChoice(qi: number) {
    setQuizQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? {
              ...q,
              choices: [
                ...q.choices,
                { text: `Option ${q.choices.length + 1}`, isCorrect: false, order: q.choices.length + 1 },
              ],
            }
          : q
      )
    )
  }
  function removeChoice(qi: number, ci: number) {
    setQuizQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? {
              ...q,
              choices: q.choices.filter((_, j) => j !== ci).map((c, j) => ({ ...c, order: j + 1 })),
            }
          : q
      )
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = await updateContent(orgSlug, contentItem.id, {
      title,
      description: description || undefined,
      videoUrl: contentItem.type === "VIDEO" ? videoUrl : undefined,
      videoDuration: contentItem.type === "VIDEO" && videoDuration ? parseInt(videoDuration, 10) : undefined,
      articleContent: contentItem.type === "ARTICLE" ? articleContent : undefined,
      attestationText: contentItem.type === "ATTESTATION" ? attestationText : undefined,
      slides: contentItem.type === "SLIDE_DECK" ? slides.map((s, i) => ({ ...s, order: i + 1 })) : undefined,
      formSchemaJson:
        contentItem.type === "FORM" ? JSON.stringify(formFields, null, 0) : undefined,
      quizQuestions: contentItem.type === "QUIZ" ? quizQuestions.map((q, i) => ({ ...q, order: i + 1, choices: q.choices.map((c, j) => ({ ...c, order: j + 1 })) })) : undefined,
      quizPassingScore: contentItem.type === "QUIZ" ? quizPassingScore : undefined,
      quizAllowRetry: contentItem.type === "QUIZ" ? quizAllowRetry : undefined,
      quizShowAnswersAfter: contentItem.type === "QUIZ" ? quizShowAnswersAfter : undefined,
    })
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Edit</CardTitle>
          <CardDescription>Update title, description, and type-specific fields.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {contentItem.type === "VIDEO" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoDuration">Duration (seconds, optional)</Label>
                <Input
                  id="videoDuration"
                  type="number"
                  min={0}
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value)}
                />
              </div>
            </>
          )}

          {contentItem.type === "ARTICLE" && (
            <div className="space-y-2">
              <Label htmlFor="articleContent">Content</Label>
              <textarea
                id="articleContent"
                className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm"
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
              />
            </div>
          )}

          {contentItem.type === "ATTESTATION" && (
            <div className="space-y-2">
              <Label htmlFor="attestationText">Acknowledgment text</Label>
              <textarea
                id="attestationText"
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm"
                value={attestationText}
                onChange={(e) => setAttestationText(e.target.value)}
              />
            </div>
          )}

          {contentItem.type === "SLIDE_DECK" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Slides</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pptx"
                    className="hidden"
                    id="import-pptx"
                    onChange={handleImportPptx}
                    disabled={importing}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportPptx}
                    disabled={exporting || !contentItem.slideDeck?.id || slides.length === 0}
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    {exporting ? "Exporting…" : "Download as PowerPoint"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportPptx}
                    disabled={exporting || !contentItem.slideDeck?.id || slides.length === 0}
                    title="Export as template"
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    Export Template
                  </Button>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center transition-colors",
                  dragActive && "border-primary/50 bg-muted/50",
                  importing && "pointer-events-none opacity-70"
                )}
              >
                <p className="text-sm text-muted-foreground mb-3">
                  Drag and drop a .pptx file here, or click to browse
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("import-pptx")?.click()}
                  disabled={importing}
                >
                  <FileUp className="h-4 w-4 mr-1" />
                  {importing ? "Importing…" : "Import PPTX"}
                </Button>
              </div>

              {slides.length > 0 && (
                <>
                  <div>
                    <Label className="text-sm text-muted-foreground">Slide overview</Label>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                      Click a slide to edit title, content, and speaker notes. Reorder or remove below.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {slides.map((slide, i) => (
                        <Card
                          key={i}
                          variant="interactive"
                          className="cursor-pointer overflow-hidden"
                          onClick={() => setEditSlideIndex(i)}
                        >
                          <div className="flex items-start gap-2 p-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                              {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate text-sm">{slide.title || "Untitled"}</p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {slide.content?.replace(/\n/g, " ").trim() || "No content"}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditSlideIndex(i)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="flex border-t border-border/40 px-2 py-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveSlide(i, -1)
                              }}
                              disabled={i === 0}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveSlide(i, 1)
                              }}
                              disabled={i === slides.length - 1}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeSlide(i)
                              }}
                              disabled={slides.length <= 1}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSlide}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add slide
                  </Button>
                </>
              )}

              <Dialog open={editSlideIndex !== null} onOpenChange={(open) => !open && setEditSlideIndex(null)}>
                <DialogContent
                  onClose={() => setEditSlideIndex(null)}
                  className="max-h-[90vh] overflow-y-auto"
                >
                  {editSlideIndex !== null && (
                    <>
                      <DialogHeader>
                        <DialogTitle>Edit slide {editSlideIndex + 1}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={slides[editSlideIndex]?.title ?? ""}
                            onChange={(e) =>
                              setSlides((prev) =>
                                prev.map((s, j) =>
                                  j === editSlideIndex ? { ...s, title: e.target.value } : s
                                )
                              )}
                            placeholder="Slide title"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Layout</Label>
                          <select
                            value={slides[editSlideIndex]?.layoutType ?? "TITLE_AND_BODY"}
                            onChange={(e) =>
                              setSlides((prev) =>
                                prev.map((s, j) =>
                                  j === editSlideIndex ? { ...s, layoutType: e.target.value || null } : s
                                )
                              )}
                            className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                          >
                            {SLIDE_LAYOUTS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Content (Markdown supported)</Label>
                          <textarea
                            className="mt-1 flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm"
                            value={slides[editSlideIndex]?.content ?? ""}
                            onChange={(e) =>
                              setSlides((prev) =>
                                prev.map((s, j) =>
                                  j === editSlideIndex ? { ...s, content: e.target.value } : s
                                )
                              )}
                            placeholder="Bullets: start lines with - or *"
                          />
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Speaker notes (trainer only)</Label>
                          <textarea
                            className="mt-1 flex min-h-[60px] w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm"
                            value={slides[editSlideIndex]?.notesRichText ?? ""}
                            onChange={(e) =>
                              setSlides((prev) =>
                                prev.map((s, j) =>
                                  j === editSlideIndex ? { ...s, notesRichText: e.target.value || null } : s
                                )
                              )}
                            placeholder="Notes for presenter"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEditSlideIndex(null)}>
                          Done
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {contentItem.type === "FORM" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Form fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFormField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add field
                </Button>
              </div>
              <div className="space-y-3">
                {formFields.map((field, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex gap-2 items-center">
                        <Input
                          value={field.id}
                          onChange={(e) =>
                            setFormFields((prev) =>
                              prev.map((f, j) => (j === i ? { ...f, id: e.target.value } : f))
                            )
                          }
                          placeholder="Field ID (e.g. email)"
                          className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFormField(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          setFormFields((prev) =>
                            prev.map((f, j) => (j === i ? { ...f, label: e.target.value } : f))
                          )
                        }
                        placeholder="Label"
                      />
                      <div className="flex gap-2 items-center flex-wrap">
                        <select
                          value={field.type}
                          onChange={(e) =>
                            setFormFields((prev) =>
                              prev.map((f, j) => (j === i ? { ...f, type: e.target.value } : f))
                            )
                          }
                          className="flex h-9 rounded-lg border border-input bg-background px-2 text-sm"
                        >
                          {FORM_FIELD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required ?? false}
                            onChange={(e) =>
                              setFormFields((prev) =>
                                prev.map((f, j) => (j === i ? { ...f, required: e.target.checked } : f))
                              )
                            }
                          />
                          Required
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {contentItem.type === "QUIZ" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Quiz settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="passingScore" className="w-32">Passing score %</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min={0}
                      max={100}
                      value={quizPassingScore}
                      onChange={(e) => setQuizPassingScore(parseInt(e.target.value, 10) || 70)}
                      className="w-20"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={quizAllowRetry}
                      onChange={(e) => setQuizAllowRetry(e.target.checked)}
                    />
                    Allow retry
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={quizShowAnswersAfter}
                      onChange={(e) => setQuizShowAnswersAfter(e.target.checked)}
                    />
                    Show answers after submission
                  </label>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Questions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addQuizQuestion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add question
                  </Button>
                </div>
                {quizQuestions.map((q, qi) => (
                  <Card key={qi}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Question {qi + 1}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeQuizQuestion(qi)} disabled={quizQuestions.length <= 1}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <Input
                        value={q.text}
                        onChange={(e) =>
                          setQuizQuestions((prev) =>
                            prev.map((qu, i) => (i === qi ? { ...qu, text: e.target.value } : qu))
                          )
                        }
                        placeholder="Question text"
                      />
                      <div className="flex gap-2">
                        <select
                          value={q.type}
                          onChange={(e) =>
                            setQuizQuestions((prev) =>
                              prev.map((qu, i) =>
                                i === qi
                                  ? {
                                      ...qu,
                                      type: e.target.value,
                                      choices:
                                        e.target.value === "TRUE_FALSE"
                                          ? [
                                              { text: "True", isCorrect: false, order: 1 },
                                              { text: "False", isCorrect: true, order: 2 },
                                            ]
                                          : qu.choices,
                                    }
                                  : qu
                              )
                            )
                          }
                          className="flex h-9 rounded-lg border border-input bg-background px-2 text-sm"
                        >
                          <option value="MULTIPLE_CHOICE">Multiple choice</option>
                          <option value="TRUE_FALSE">True / False</option>
                        </select>
                        <Input
                          value={q.explanation ?? ""}
                          onChange={(e) =>
                            setQuizQuestions((prev) =>
                              prev.map((qu, i) => (i === qi ? { ...qu, explanation: e.target.value } : qu))
                            )
                          }
                          placeholder="Explanation (shown after answer)"
                          className="flex-1"
                        />
                      </div>
                      <div className="space-y-2 pl-2 border-l-2 border-muted">
                        <span className="text-xs font-medium text-muted-foreground">Choices</span>
                        {q.choices.map((choice, ci) => (
                          <div key={ci} className="flex gap-2 items-center">
                            <input
                              type="radio"
                              name={`q-${qi}-correct`}
                              checked={choice.isCorrect}
                              onChange={() =>
                                setQuizQuestions((prev) =>
                                  prev.map((qu, i) =>
                                    i === qi
                                      ? {
                                          ...qu,
                                          choices: qu.choices.map((c, j) => ({
                                            ...c,
                                            isCorrect: j === ci,
                                          })),
                                        }
                                      : qu
                                  )
                                )
                              }
                              title="Correct answer"
                            />
                            <Input
                              value={choice.text}
                              onChange={(e) =>
                                setQuizQuestions((prev) =>
                                  prev.map((qu, i) =>
                                    i === qi
                                      ? {
                                          ...qu,
                                          choices: qu.choices.map((c, j) =>
                                            j === ci ? { ...c, text: e.target.value } : c
                                          ),
                                        }
                                      : qu
                                  )
                                )
                              }
                              placeholder="Choice text"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeChoice(qi, ci)}
                              disabled={q.choices.length <= 2}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addChoice(qi)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add choice
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit">Save</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
