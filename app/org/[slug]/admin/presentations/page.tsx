import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { PresentationsUpload } from "./presentations-upload"
import { PresentationsTableWithBulkDelete } from "./presentations-table"

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
      contentItem: { select: { id: true, title: true } },
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
        description="Upload .pptx decks for speaker notes and narration. These appear as Slide deck content in Trainer → Curricula and can be added to any curriculum section. Use Manage to edit narrator notes and generate audio."
      />

      <PresentationsUpload orgSlug={slug} />

      <PresentationsTableWithBulkDelete orgSlug={slug} decks={decks} />
    </div>
  )
}

