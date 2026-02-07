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

interface NewGroupPageProps {
  params: { slug: string }
}

export default function NewGroupPage({ params }: NewGroupPageProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await createGroup(params.slug, formData)
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.push(`/org/${params.slug}/admin/groups`)
    router.refresh()
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-5">
        <Button variant="ghost" size="icon" asChild className="-ml-1">
          <Link href={`/org/${params.slug}/admin/groups`}>
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
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create group"}
              </Button>
              <Button type="button" variant="outline" asChild disabled={pending}>
                <Link href={`/org/${params.slug}/admin/groups`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
