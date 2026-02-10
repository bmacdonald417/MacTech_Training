"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"

const ROLES = [
  { value: "TRAINEE", label: "Trainee" },
  { value: "TRAINER", label: "Trainer" },
  { value: "ADMIN", label: "Admin" },
] as const

export function NewUserForm({ slug }: { slug: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const usersUrl = `/org/${slug}/admin/users`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const email = (formData.get("email") as string)?.trim()
    const name = (formData.get("name") as string)?.trim()
    const password = formData.get("password") as string
    const role = (formData.get("role") as string) || "TRAINEE"

    if (!email) {
      setError("Email is required.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/org/${slug}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, password: password || undefined, role }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || "Failed to add user.")
        setLoading(false)
        return
      }

      router.push(usersUrl)
      router.refresh()
    } catch {
      setError("Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-5">
        <Button variant="ghost" size="icon" asChild className="-ml-1">
          <Link href={usersUrl}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Add User
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Create a new user or add an existing user to this organization
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>User details</CardTitle>
          <CardDescription>
            If the email already exists, they will be added to this org with the selected role. Otherwise a new account will be created (password required).
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
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="user@example.com"
                autoComplete="email"
                disabled={loading}
                aria-invalid={!!error}
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground">
                Name <span className="font-normal">(optional)</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Display name"
                autoComplete="name"
                disabled={loading}
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground">
                Password <span className="font-normal">(optional for existing users)</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Leave blank if user already exists"
                autoComplete="new-password"
                disabled={loading}
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground">
                Role
              </Label>
              <select
                id="role"
                name="role"
                disabled={loading}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground hover:border-input/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue="TRAINEE"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Adding…" : "Add User"}
              </Button>
              <Button type="button" variant="outline" asChild disabled={loading}>
                <Link href={usersUrl}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
