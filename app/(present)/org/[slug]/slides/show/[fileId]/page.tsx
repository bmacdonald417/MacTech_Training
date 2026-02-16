import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { SlideShowPageClient } from "./slide-show-page-client"

export const dynamic = "force-dynamic"

/**
 * Full-page in-browser slide show (presentation mode).
 * Uses server-rendered slide images; keyboard, touch, fullscreen.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; fileId: string }>
}) {
  const { slug, fileId } = await params
  await requireAuth(slug)

  const deck = await prisma.slideDeck.findFirst({
    where: { sourceFileId: fileId },
    select: {
      contentItem: { select: { title: true } },
      sourceFile: { select: { filename: true } },
      slides: { orderBy: { order: "asc" }, select: { id: true } },
    },
  })

  const title =
    deck?.contentItem?.title ?? deck?.sourceFile?.filename ?? "Presentation"
  const slideCount = deck?.slides?.length ?? null

  return (
    <SlideShowPageClient
      orgSlug={slug}
      sourceFileId={fileId}
      title={title}
      initialSlideCount={slideCount}
    />
  )
}
