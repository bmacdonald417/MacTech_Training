import { NextRequest, NextResponse } from "next/server"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/org/[slug]/content/bulk-delete
 * Trainer or admin. Body: { ids: string[] }. Deletes each content item (cascade).
 * Cleans up stored files for slide decks when no other deck uses them.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const membership = await requireTrainerOrAdmin(slug)

    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : []
    if (ids.length === 0) {
      return NextResponse.json({ error: "No ids provided." }, { status: 400 })
    }

    const items = await prisma.contentItem.findMany({
      where: {
        id: { in: ids },
        orgId: membership.orgId,
      },
      select: {
        id: true,
        slideDeck: { select: { sourceFileId: true } },
      },
    })

    const sourceFileIds = Array.from(
      new Set(
        items
          .map((i) => i.slideDeck?.sourceFileId)
          .filter((id): id is string => id != null)
      )
    )

    await prisma.contentItem.deleteMany({
      where: { id: { in: ids } },
    })

    for (const sourceFileId of sourceFileIds) {
      const otherDecks = await prisma.slideDeck.count({
        where: { sourceFileId },
      })
      if (otherDecks === 0) {
        await prisma.storedFile.deleteMany({
          where: { id: sourceFileId },
        })
      }
    }

    return NextResponse.json({ ok: true, deleted: items.length })
  } catch (err) {
    console.error("[content/bulk-delete]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk delete failed" },
      { status: 500 }
    )
  }
}
