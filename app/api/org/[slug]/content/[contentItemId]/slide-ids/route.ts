import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/org/[slug]/content/[contentItemId]/slide-ids
 * Returns ordered slide IDs for a slide-deck content item (for narration lookup in training).
 * Any authenticated org member.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string; contentItemId: string }> }
) {
  try {
    const { slug, contentItemId } = await context.params
    const membership = await requireAuth(slug)

    const item = await prisma.contentItem.findFirst({
      where: {
        id: contentItemId,
        orgId: membership.orgId,
        type: "SLIDE_DECK",
      },
      select: {
        slideDeck: {
          select: {
            slides: {
              orderBy: { order: "asc" },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!item?.slideDeck?.slides?.length) {
      return NextResponse.json({ slideIds: [] })
    }

    const slideIds = item.slideDeck.slides.map((s) => s.id)
    return NextResponse.json({ slideIds })
  } catch (err) {
    console.error("[content/slide-ids]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load slide IDs" },
      { status: 500 }
    )
  }
}
