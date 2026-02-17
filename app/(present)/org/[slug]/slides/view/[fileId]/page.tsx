import { PptxPresentationViewer } from "@/components/training/pptx-presentation-viewer"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; fileId: string }>
}) {
  const { slug, fileId } = await params
  const membership = await requireAuth(slug)

  const slideDeck = await prisma.slideDeck.findFirst({
    where: {
      sourceFileId: fileId,
      contentItem: { orgId: membership.orgId },
    },
    select: {
      contentItemId: true,
      contentItem: { select: { title: true } },
    },
  })

  if (!slideDeck) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8 text-muted-foreground">
        Presentation not found.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[100dvh] flex-col overflow-hidden bg-background p-4">
      <PptxPresentationViewer
        orgSlug={slug}
        sourceFileId={fileId}
        title={slideDeck.contentItem?.title ?? "Presentation"}
      />
    </div>
  )
}
