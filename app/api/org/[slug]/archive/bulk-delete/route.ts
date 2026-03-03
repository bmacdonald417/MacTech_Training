import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/org/[slug]/archive/bulk-delete
 * Admin only. Body: { ids: string[] }. Deletes the given archive log entries.
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

    const result = await prisma.archivedModuleLog.deleteMany({
      where: {
        id: { in: ids },
        orgId: membership.orgId,
      },
    })

    return NextResponse.json({ ok: true, deleted: result.count })
  } catch (err) {
    console.error("[archive/bulk-delete]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk delete failed" },
      { status: 500 }
    )
  }
}
