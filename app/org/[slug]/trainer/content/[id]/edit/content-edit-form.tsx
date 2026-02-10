"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateContent, type SlideInput, type FormFieldInput, type QuizQuestionInput } from "../../actions"
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"

type SlideDeckWithSlides = {
  id: string
  slides: { id: string; title: string; content: string; order: number }[]
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
    })) ?? []
  const [slides, setSlides] = useState<SlideInput[]>(
    initialSlides.length > 0 ? initialSlides : [{ title: "Slide 1", content: "", order: 1 }]
  )

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
    setSlides((prev) => [...prev, { title: `Slide ${prev.length + 1}`, content: "", order: prev.length + 1 }])
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
              <div className="flex items-center justify-between">
                <Label>Slides</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSlide}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add slide
                </Button>
              </div>
              <div className="space-y-4">
                {slides.map((slide, i) => (
                  <Card key={i}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={slide.title}
                          onChange={(e) =>
                            setSlides((prev) =>
                              prev.map((s, j) => (j === i ? { ...s, title: e.target.value } : s))
                            )
                          }
                          placeholder="Slide title"
                          className="font-medium"
                        />
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => moveSlide(i, -1)} disabled={i === 0}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSlide(i)} disabled={slides.length <= 1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <textarea
                        className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm"
                        value={slide.content}
                        onChange={(e) =>
                          setSlides((prev) =>
                            prev.map((s, j) => (j === i ? { ...s, content: e.target.value } : s))
                          )
                        }
                        placeholder="Slide content (markdown supported)"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
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
