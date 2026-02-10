"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { createGroup } from "../actions"

export function NewGroupForm({ slug }: { slug: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const groupsUrl = `/org/${slug}/admin/groups`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await createGroup(slug, formData)
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.push(groupsUrl)
    router.refresh()
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
            Create Group
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Add a new group for bulk assignments
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Group details</CardTitle>
          <CardDescription>
            Give the group a name. You can add members after creating it.
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
            <div className="space-y-2">
              <Label htmlFor="name">Group name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Sales Team, New Hires 2024"
                disabled={pending}
                aria-invalid={!!error}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupType">Group type (optional)</Label>
              <select
                id="groupType"
                name="groupType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={pending}
              >
                <option value="">None</option>
                <option value="Organization">Organization</option>
                <option value="Event">Event</option>
                <option value="School">School</option>
                <option value="Employer">Employer</option>
                <option value="Other">Other</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Helps categorize the group (e.g. for events, schools, employers). A join link and QR code will be generated so users can join after sign-up.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create group"}
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
