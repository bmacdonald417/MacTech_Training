import Link from "next/link"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import {
  TableShell,
  TableShellBody,
  TableShellHeader,
  TableShellRow,
} from "@/components/ui/table-shell"
import { Button } from "@/components/ui/button"
import { MonitorPlay, ExternalLink } from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PresentationsAdminPage({ params }: PageProps) {
  const { slug } = await params
  const membership = await requireAdmin(slug)

  const decks = await prisma.slideDeck.findMany({
    where: {
      sourceFileId: { not: null },
      contentItem: { orgId: membership.orgId },
    },
    select: {
      id: true,
      contentItem: { select: { title: true } },
      sourceFile: { select: { id: true, filename: true } },
      slides: { select: { id: true } },
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="space-y-10">
      <PageHeader
        title="Presentations"
        description="Backdoor settings for PPTX decks (speaker notes + narration/TTS)"
      />

      <TableShell>
        <TableShellHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              PPTX slide decks
            </h2>
            <span className="text-sm text-muted-foreground">
              {decks.length} total
            </span>
          </div>
        </TableShellHeader>
        <TableShellBody>
          {decks.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              No PowerPoint-backed slide decks found for this org.
            </div>
          ) : (
            decks.map((d) => (
              <TableShellRow key={d.id}>
                <div className="flex flex-1 items-center gap-4 min-w-0">
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
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/org/${slug}/admin/presentations/${d.id}`}>
                      Manage
                    </Link>
                  </Button>
                  {d.sourceFile?.id && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/org/${slug}/slides/view/${d.sourceFile.id}?from=${encodeURIComponent(
                          `/org/${slug}/admin/presentations`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="gap-1"
                      >
                        Open viewer <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </TableShellRow>
            ))
          )}
        </TableShellBody>
      </TableShell>
    </div>
  )
}

