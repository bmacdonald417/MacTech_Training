import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/org/[slug]/narration?entityType=SLIDE|ARTICLE&entityId=...
 * Returns narration status and stream URL for cache-busting playback.
 * Any org member can read.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const membership = await requireAuth(params.slug)
    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      )
    }

    const allowed = ["SLIDE", "SLIDE_DECK", "ARTICLE"]
    if (!allowed.includes(entityType)) {
      return NextResponse.json({ error: "Invalid entityType" }, { status: 400 })
    }

    const asset = await prisma.narrationAsset.findUnique({
      where: {
        orgId_entityType_entityId: {
          orgId: membership.orgId,
          entityType: entityType as "SLIDE" | "SLIDE_DECK" | "ARTICLE",
          entityId,
        },
      },
    })

    if (!asset) {
      return NextResponse.json({
        hasNarration: false,
      })
    }

    const v = new Date(asset.updatedAt).getTime()
    const streamUrl = `/api/org/${params.slug}/narration/stream?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&v=${v}`

    return NextResponse.json({
      hasNarration: true,
      updatedAt: asset.updatedAt.toISOString(),
      streamUrl,
    })
  } catch (e) {
    if (String(e).includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[narration GET]", e)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
