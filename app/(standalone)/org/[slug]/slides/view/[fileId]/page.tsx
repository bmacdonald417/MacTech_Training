import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PptxStandaloneViewer } from "@/components/training/pptx-standalone-viewer"

interface PageProps {
  params: Promise<{ slug: string; fileId: string }>
}

export default async function StandaloneSlidesViewerPage({ params }: PageProps) {
  const { slug, fileId } = await params
  const membership = await requireAuth(slug)

  const file = await prisma.storedFile.findFirst({
    where: { id: fileId, orgId: membership.orgId },
    select: { filename: true },
  })

  // Viewer handles load errors too, but this gives a quick/cheap 404-like state.
  if (!file) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
        <div className="max-w-lg rounded-xl border border-border/40 bg-card p-6 text-card-foreground">
          <div className="text-sm font-medium">Deck not found</div>
          <div className="mt-2 text-sm text-muted-foreground">
            This file may have been removed or you may not have access.
          </div>
        </div>
      </div>
    )
  }

  return (
    <PptxStandaloneViewer
      orgSlug={slug}
      sourceFileId={fileId}
      filename={file.filename}
    />
  )
}

