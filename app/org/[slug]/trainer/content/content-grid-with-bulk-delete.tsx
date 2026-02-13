"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText,
  Video,
  BookOpen,
  CheckSquare,
  FileCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BulkSelectProvider,
  BulkSelectCheckbox,
  BulkSelectHeaderCheckbox,
  BulkSelectBar,
} from "@/components/admin/bulk-select-actions"
import { Trash2 } from "lucide-react"

const contentTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ARTICLE: FileText,
  SLIDE_DECK: BookOpen,
  VIDEO: Video,
  QUIZ: CheckSquare,
  ATTESTATION: FileCheck,
  FORM: FileText,
}

type ContentItemRow = {
  id: string
  title: string
  type: string
  description: string | null
}

export function ContentGridWithBulkDelete({
  orgSlug,
  basePath,
  contentItems,
}: {
  orgSlug: string
  basePath: string
  contentItems: ContentItemRow[]
}) {
  const router = useRouter()
  const itemIds = contentItems.map((c) => c.id)

  async function handleBulkDelete(ids: string[]) {
    const res = await fetch(`/api/org/${orgSlug}/content/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error ?? "Bulk delete failed.")
      return
    }
    router.refresh()
  }

  async function handleSingleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/org/${orgSlug}/content/${id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error ?? "Delete failed.")
      return
    }
    router.refresh()
  }

  return (
    <BulkSelectProvider itemIds={itemIds}>
      <div className="space-y-3">
        <BulkSelectBar
          onBulkDelete={handleBulkDelete}
          confirmMessage="Delete {n} item(s)? This cannot be undone."
          deleteLabel="Delete selected"
        />
        {contentItems.length > 0 && (
          <div className="flex items-center gap-3 pb-2">
            <BulkSelectHeaderCheckbox />
            <span className="text-sm text-muted-foreground">Select all</span>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contentItems.map((item) => {
            const Icon = contentTypeIcons[item.type] || FileText
            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <BulkSelectCheckbox id={item.id} />
                      <Icon className="h-5 w-5 shrink-0 text-primary" />
                      <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleSingleDelete(item.id, item.title)}
                      title="Delete"
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>{item.type.replace("_", " ")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`${basePath}/${item.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`${basePath}/${item.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </BulkSelectProvider>
  )
}
