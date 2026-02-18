"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { MonitorPlay, ExternalLink, BookOpenPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  TableShell,
  TableShellBody,
  TableShellHeader,
  TableShellRow,
} from "@/components/ui/table-shell"
import {
  BulkSelectProvider,
  BulkSelectCheckbox,
  BulkSelectHeaderCheckbox,
  BulkSelectBar,
} from "@/components/admin/bulk-select-actions"
import { PresentationDeleteButton } from "./presentation-delete-button"

type DeckRow = {
  id: string
  contentItem: { id: string; title: string | null } | null
  sourceFile: { id: string; filename: string | null } | null
  slides: { id: string }[]
  updatedAt: Date
}

export function PresentationsTableWithBulkDelete({
  orgSlug,
  decks,
}: {
  orgSlug: string
  decks: DeckRow[]
}) {
  const router = useRouter()
  const itemIds = decks.map((d) => d.id)

  async function handleBulkDelete(ids: string[]) {
    const res = await fetch(`/api/org/${orgSlug}/slides/deck/bulk-delete`, {
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

  return (
    <BulkSelectProvider itemIds={itemIds}>
      <div className="space-y-3">
        <BulkSelectBar
          onBulkDelete={handleBulkDelete}
          confirmMessage="Delete {n} presentation(s)? This removes the presentations and their slides. This cannot be undone."
          deleteLabel="Delete selected"
        />
        <TableShell>
          <TableShellHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {decks.length > 0 && <BulkSelectHeaderCheckbox />}
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  PPTX slide decks
                </h2>
              </div>
              <span className="text-sm text-muted-foreground">{decks.length} total</span>
            </div>
          </TableShellHeader>
          <TableShellBody>
            {decks.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                No PowerPoint-backed slide decks yet. Upload a .pptx above to add one; it will appear
                in this table and you can open Manage to edit narrator notes and generate audio.
              </div>
            ) : (
              decks.map((d) => (
                <TableShellRow key={d.id}>
                  <div className="flex flex-1 items-center gap-4 min-w-0">
                    <BulkSelectCheckbox id={d.id} />
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                      <MonitorPlay className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {d.contentItem?.title ?? "Untitled presentation"}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {d.sourceFile?.filename ?? "PPTX file"}
                        <span className="mx-2 text-muted-foreground/40">•</span>
                        {d.slides.length} slide{d.slides.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {d.contentItem?.id && (
                      <Button variant="outline" size="sm" asChild className="gap-1">
                        <Link
                          href={`/org/${orgSlug}/trainer/curricula/new?addContent=${encodeURIComponent(d.contentItem.id)}`}
                        >
                          <BookOpenPlus className="h-4 w-4" />
                          Add to curriculum
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/org/${orgSlug}/admin/presentations/${d.id}`}>Manage</Link>
                    </Button>
                    {d.sourceFile?.id && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/org/${orgSlug}/slides/view/${d.sourceFile.id}?from=${encodeURIComponent(
                            `/org/${orgSlug}/admin/presentations`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="gap-1"
                        >
                          Open viewer <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <PresentationDeleteButton
                      orgSlug={orgSlug}
                      slideDeckId={d.id}
                      title={d.contentItem?.title ?? d.sourceFile?.filename ?? "Presentation"}
                    />
                  </div>
                </TableShellRow>
              ))
            )}
          </TableShellBody>
        </TableShell>
      </div>
    </BulkSelectProvider>
  )
}
