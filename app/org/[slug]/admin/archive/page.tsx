import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Archive } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArchiveTableWithBulkDelete } from "./archive-table-with-bulk-delete"

interface ArchivePageProps {
  params: Promise<{ slug: string }>
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { slug } = await params
  const membership = await requireAdmin(slug)

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
            <ArchiveTableWithBulkDelete orgSlug={slug} archived={archived} />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href={`/org/${slug}/admin/reports`}>Back to Reports</Link>
        </Button>
      </div>
    </div>
  )
}
