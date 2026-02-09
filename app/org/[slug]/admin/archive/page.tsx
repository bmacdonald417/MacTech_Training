import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TableShell, TableShellHeader, TableShellBody } from "@/components/ui/table-shell"
import { Archive } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ArchivePageProps {
  params: { slug: string }
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const membership = await requireAdmin(params.slug)

  const archived = await prisma.archivedModuleLog.findMany({
    where: { orgId: membership.orgId },
    orderBy: { archivedAt: "desc" },
  })

  return (
    <div className="space-y-10">
      <PageHeader
        title="Archived modules"
        description="Previous versions of content, curricula, and certificates removed during deduplication. Only the current version of each module appears in Content and Curricula."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Archive log</CardTitle>
          </div>
          <CardDescription>
            Records of removed duplicates; kept for data retention. The active interface shows only the
            single current version per module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {archived.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No archived modules yet.</p>
          ) : (
            <TableShell>
              <TableShellHeader>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Archived record</span>
                  <span className="text-sm text-muted-foreground">
                    {archived.length} record{archived.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </TableShellHeader>
              <TableShellBody>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-left text-muted-foreground">
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
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href={`/org/${params.slug}/admin/reports`}>Back to Reports</Link>
        </Button>
      </div>
    </div>
  )
}
