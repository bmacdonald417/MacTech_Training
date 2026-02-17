import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/org/[slug]/slides/file/[fileId]
 * Returns 403 Forbidden. PPTX content is company-private; view slides in-browser via slide-image API only.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string; fileId: string }> }
) {
  try {
    const { slug, fileId } = await context.params
    const membership = await requireAuth(slug)

    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, orgId: membership.orgId },
      select: { id: true },
    })
    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 })
    }

    return NextResponse.json(
      { error: "Download of presentation files is not permitted. View slides in your browser." },
      { status: 403 }
    )
  } catch (err) {
    console.error("[slides/file]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    )
  }
}
