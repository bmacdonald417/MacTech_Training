import { NextRequest, NextResponse } from "next/server"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * DELETE /api/org/[slug]/content/[contentItemId]
 * Trainer or admin. Deletes the content item (cascades to article/slideDeck/video/quiz/etc.).
 * If it was a slide deck with a source file, deletes the stored file when no other deck uses it.
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string; contentItemId: string }> }
) {
  try {
    const { slug, contentItemId } = await context.params
    const membership = await requireTrainerOrAdmin(slug)

    const item = await prisma.contentItem.findFirst({
      where: {
        id: contentItemId,
        orgId: membership.orgId,
      },
      select: {
        id: true,
        type: true,
        slideDeck: { select: { id: true, sourceFileId: true } },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 })
    }

    let sourceFileId: string | null = null
    if (item.slideDeck?.sourceFileId) {
      sourceFileId = item.slideDeck.sourceFileId
    }

    await prisma.contentItem.delete({
      where: { id: contentItemId },
    })

    if (sourceFileId) {
      const otherDecks = await prisma.slideDeck.count({
        where: { sourceFileId },
      })
      if (otherDecks === 0) {
        await prisma.storedFile.deleteMany({
          where: { id: sourceFileId },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[content DELETE]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    )
  }
}
