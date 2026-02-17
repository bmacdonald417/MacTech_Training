import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/rbac"
import { runStorageCleanup } from "@/lib/storage-cleanup"

/**
 * POST /api/org/[slug]/admin/storage/clear
 * Admin only. Wipes slide-image cache and deletes orphaned files on the volume
 * (files no longer referenced in DB). Frees disk space when GUI deletes don't remove files.
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    await requireAdmin(slug)
    const result = await runStorageCleanup()
    return NextResponse.json(result)
  } catch (err) {
    console.error("[admin/storage/clear]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Storage clear failed" },
      { status: 500 }
    )
  }
}
