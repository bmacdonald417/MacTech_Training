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
      id: true,
      contentItem: { select: { title: true } },
      slides: {
        orderBy: { order: "asc" },
        select: { id: true },
      },
    },
  })

  return (
    <PptxPresentationViewer
      orgSlug={slug}
      sourceFileId={fileId}
      title={slideDeck?.contentItem?.title ?? "Presentation"}
      slideIds={slideDeck?.slides?.map((s) => s.id) ?? []}
    />
  )
}

