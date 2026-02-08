"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateContent } from "../../actions"

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
  }
}

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

          {(contentItem.type === "SLIDE_DECK" || contentItem.type === "FORM" || contentItem.type === "QUIZ") && (
            <p className="text-sm text-muted-foreground">
              Slides, form fields, and quiz questions can be edited in a future update. You can update title and description above.
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit">Save</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
