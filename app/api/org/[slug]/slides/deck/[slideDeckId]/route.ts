import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * DELETE /api/org/[slug]/slides/deck/[slideDeckId]
 * Admin only. Deletes the slide deck's content item (cascades to deck + slides),
 * then deletes the stored file if no other deck references it.
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string; slideDeckId: string }> }
) {
  try {
    const { slug, slideDeckId } = await context.params
    const membership = await requireAdmin(slug)

    const deck = await prisma.slideDeck.findFirst({
      where: {
        id: slideDeckId,
        contentItem: { orgId: membership.orgId },
      },
      select: {
        id: true,
        contentItemId: true,
        sourceFileId: true,
      },
    })

    if (!deck) {
      return NextResponse.json({ error: "Slide deck not found." }, { status: 404 })
    }

    const sourceFileId = deck.sourceFileId

    await prisma.contentItem.delete({
      where: { id: deck.contentItemId },
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
    console.error("[slides/deck DELETE]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    )
  }
}
