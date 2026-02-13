import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { resolveStoredFileAbsolutePath } from "@/lib/stored-file-storage"
import { ensureSlideBackgrounds } from "@/lib/pptx-normalize"
import fs from "fs"

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"

/**
 * GET /api/org/[slug]/slides/file/[fileId]
 * Serve the stored PPTX file. Auth: any org member (trainee can view training content).
 * Normalizes the PPTX so slides without a background get a default (fixes pptx-preview "background" error).
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
    let buffer: Buffer
    try {
      buffer = await fs.promises.readFile(fullPath)
    } catch {
      return NextResponse.json(
        { error: "File not found on disk.", code: "FILE_MISSING_ON_DISK" },
        { status: 404 }
      )
    }

    if (file.mimeType === PPTX_MIME || file.filename?.toLowerCase().endsWith(".pptx")) {
      try {
        buffer = await ensureSlideBackgrounds(buffer)
      } catch (e) {
        console.warn("[slides/file] pptx normalize failed, serving original:", e)
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
        "Content-Length": String(buffer.byteLength),
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
