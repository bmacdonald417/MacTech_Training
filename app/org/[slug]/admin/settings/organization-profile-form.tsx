"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateOrganizationProfile } from "./actions"

interface OrganizationProfileFormProps {
  orgSlug: string
  initialName: string
  orgSlugDisplay: string
}

export function OrganizationProfileForm({
  orgSlug,
  initialName,
  orgSlugDisplay,
}: OrganizationProfileFormProps) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    setPending(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await updateOrganizationProfile(orgSlug, formData)
    setPending(false)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
      return
    }
    setMessage({ type: "success", text: "Settings saved." })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Profile</CardTitle>
        <CardDescription>Basic organization information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={initialName}
              placeholder="Organization name"
              disabled={pending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Organization Slug</Label>
            <Input
              id="slug"
              type="text"
              value={orgSlugDisplay}
              readOnly
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              The slug is used in URLs and cannot be changed here.
            </p>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
