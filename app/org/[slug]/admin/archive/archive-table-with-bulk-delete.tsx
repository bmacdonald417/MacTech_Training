"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { TableShell, TableShellHeader, TableShellBody } from "@/components/ui/table-shell"
import {
  BulkSelectProvider,
  BulkSelectCheckbox,
  BulkSelectHeaderCheckbox,
  BulkSelectBar,
} from "@/components/admin/bulk-select-actions"

type ArchiveRow = {
  id: string
  entityType: string
  contentType: string | null
  titleOrName: string
  archivedAt: Date
  reason: string
}

export function ArchiveTableWithBulkDelete({
  orgSlug,
  archived,
}: {
  orgSlug: string
  archived: ArchiveRow[]
}) {
  const router = useRouter()
  const itemIds = archived.map((r) => r.id)

  async function handleBulkDelete(ids: string[]) {
    const res = await fetch(`/api/org/${orgSlug}/archive/bulk-delete`, {
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
          confirmMessage="Remove {n} archive record(s) from the log? This cannot be undone."
          deleteLabel="Remove selected"
        />
        <TableShell>
          <TableShellHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {archived.length > 0 && <BulkSelectHeaderCheckbox />}
                <span className="font-medium">Archived record</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {archived.length} record{archived.length !== 1 ? "s" : ""}
              </span>
            </div>
          </TableShellHeader>
          <TableShellBody>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-muted-foreground">
                  <th className="pb-3 pr-4 w-10"></th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Title / name</th>
                  <th className="pb-3 pr-4 font-medium">Archived</th>
                  <th className="pb-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {archived.map((row) => (
                  <tr key={row.id} className="border-b border-border/30 last:border-0">
                    <td className="py-3 pr-4">
                      <BulkSelectCheckbox id={row.id} />
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-medium">{row.entityType.replace("_", " ")}</span>
                      {row.contentType && (
                        <span className="ml-1 text-muted-foreground">({row.contentType})</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 line-clamp-2" title={row.titleOrName}>
                      {row.titleOrName}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {format(new Date(row.archivedAt), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="py-3">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShellBody>
        </TableShell>
      </div>
    </BulkSelectProvider>
  )
}
