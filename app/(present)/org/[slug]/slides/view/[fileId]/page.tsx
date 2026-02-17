import { redirect } from "next/navigation"
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
    select: { contentItemId: true },
  })

  if (slideDeck?.contentItemId) {
    redirect(`/org/${slug}/trainer/content/${slideDeck.contentItemId}`)
  }

  redirect(`/org/${slug}`)
}

