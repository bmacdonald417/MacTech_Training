import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * Slides view: redirect to the image-based show page (server-rendered slide images).
 * No raw PPTX in browser = no pptx-preview background error. Company-private (no download).
 */
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
    select: { contentItemId: true },
  })

  if (!slideDeck) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8 text-muted-foreground">
        Presentation not found.
      </div>
    )
  }

  redirect(`/org/${slug}/slides/show/${fileId}`)
}
