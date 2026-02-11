import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import {
  createStoredFileReadStream,
  resolveStoredFileAbsolutePath,
} from "@/lib/stored-file-storage"
import fs from "fs"

/**
 * GET /api/org/[slug]/slides/file/[fileId]
 * Stream the stored PPTX file. Auth: any org member (trainee can view training content).
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string; fileId: string }> }
) {
  try {
    const { slug, fileId } = await context.params
    const membership = await requireAuth(slug)

    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, orgId: membership.orgId },
    })
    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 })
    }

    const fullPath = resolveStoredFileAbsolutePath(file.storagePath)
    try {
      await fs.promises.access(fullPath, fs.constants.R_OK)
    } catch {
      return NextResponse.json({ error: "File not found on disk." }, { status: 404 })
    }

    const stream = createStoredFileReadStream(file.storagePath)
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
        "Content-Length": String(file.sizeBytes),
      },
    })
  } catch (err) {
    console.error("[slides/file]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to serve file" },
      { status: 500 }
    )
  }
}
