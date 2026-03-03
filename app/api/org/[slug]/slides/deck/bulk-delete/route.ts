import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/org/[slug]/slides/deck/bulk-delete
 * Admin only. Body: { ids: string[] }. Deletes each deck (content item + optional stored file cleanup).
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const membership = await requireAdmin(slug)

    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : []
    if (ids.length === 0) {
      return NextResponse.json({ error: "No ids provided." }, { status: 400 })
    }

    const decks = await prisma.slideDeck.findMany({
      where: {
        id: { in: ids },
        contentItem: { orgId: membership.orgId },
      },
      select: {
        id: true,
        contentItemId: true,
        sourceFileId: true,
      },
    })

    const toDelete = decks.map((d) => d.contentItemId)
    const sourceFileIds = Array.from(
      new Set(decks.map((d) => d.sourceFileId).filter(Boolean))
    ) as string[]

    await prisma.contentItem.deleteMany({
      where: { id: { in: toDelete } },
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

    return NextResponse.json({ ok: true, deleted: decks.length })
  } catch (err) {
    console.error("[slides/deck/bulk-delete]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk delete failed" },
      { status: 500 }
    )
  }
}
