"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createContent } from "../actions"
import { ContentType } from "@prisma/client"

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "ARTICLE", label: "Article" },
  { value: "SLIDE_DECK", label: "Slide deck" },
  { value: "VIDEO", label: "Video" },
  { value: "FORM", label: "Form" },
  { value: "QUIZ", label: "Quiz" },
  { value: "ATTESTATION", label: "Attestation" },
]

interface ContentNewFormProps {
  orgSlug: string
  initialType: ContentType
}

export function ContentNewForm({ orgSlug, initialType }: ContentNewFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<ContentType>(initialType)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [videoDuration, setVideoDuration] = useState("")
  const [articleContent, setArticleContent] = useState("")
  const [attestationText, setAttestationText] = useState("I acknowledge the above.")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = await createContent(orgSlug, {
      type,
      title,
      description: description || undefined,
      videoUrl: type === "VIDEO" ? videoUrl : undefined,
      videoDuration: type === "VIDEO" && videoDuration ? parseInt(videoDuration, 10) : undefined,
      articleContent: type === "ARTICLE" ? articleContent : undefined,
      attestationText: type === "ATTESTATION" ? attestationText : undefined,
    })
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>New content</CardTitle>
          <CardDescription>Choose a type and fill in the details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as ContentType)}
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Content title"
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
            />
          </div>

          {type === "VIDEO" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  required={type === "VIDEO"}
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
                  placeholder="120"
                />
              </div>
            </>
          )}

          {type === "ARTICLE" && (
            <div className="space-y-2">
              <Label htmlFor="articleContent">Content</Label>
              <textarea
                id="articleContent"
                className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm"
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                placeholder="Article body (markdown or plain text)"
              />
            </div>
          )}

          {type === "ATTESTATION" && (
            <div className="space-y-2">
              <Label htmlFor="attestationText">Acknowledgment text</Label>
              <textarea
                id="attestationText"
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm"
                value={attestationText}
                onChange={(e) => setAttestationText(e.target.value)}
                placeholder="Text the user must acknowledge"
              />
            </div>
          )}

          {(type === "SLIDE_DECK" || type === "FORM" || type === "QUIZ") && (
            <p className="text-sm text-muted-foreground">
              {type === "SLIDE_DECK" && "A slide deck with one slide will be created. Add more slides in Edit."}
              {type === "FORM" && "An empty form will be created. Add fields in Edit."}
              {type === "QUIZ" && "An empty quiz will be created. Add questions in Edit."}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit">Create</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
