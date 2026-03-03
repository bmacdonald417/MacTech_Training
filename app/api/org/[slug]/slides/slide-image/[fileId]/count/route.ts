import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { resolveStoredFileAbsolutePath } from "@/lib/stored-file-storage"
import fs from "fs"
import {
  getExistingSlideImageCount,
  generateSlideImages,
} from "@/lib/pptx-to-slide-images"

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"

/**
 * GET /api/org/[slug]/slides/slide-image/[fileId]/count
 * Returns { count: number }. Triggers slide image generation if none exist.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string; fileId: string }> }
) {
  try {
    const { slug, fileId } = await context.params
    const membership = await requireAuth(slug)

    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, orgId: membership.orgId },
      select: { id: true, mimeType: true, filename: true, storagePath: true, contentBytes: true },
    })
    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 })
    }

    let count = await getExistingSlideImageCount(fileId)
    if (count === 0) {
      let buffer: Buffer
      if (file.storagePath === "db" && file.contentBytes && file.contentBytes.length > 0) {
        buffer = Buffer.isBuffer(file.contentBytes)
          ? file.contentBytes
          : Buffer.from(file.contentBytes as ArrayBuffer)
      } else {
        const fullPath = resolveStoredFileAbsolutePath(file.storagePath)
        try {
          buffer = await fs.promises.readFile(fullPath)
        } catch {
          return NextResponse.json(
            { error: "File not found on disk.", code: "FILE_MISSING_ON_DISK" },
            { status: 404 }
          )
        }
      }
      const isPptx =
        file.mimeType === PPTX_MIME || file.filename?.toLowerCase().endsWith(".pptx")
      if (!isPptx) {
        return NextResponse.json({ error: "Not a PPTX file." }, { status: 400 })
      }
      const result = await generateSlideImages(fileId, buffer)
      if ("error" in result) {
        return NextResponse.json(
          { error: result.error, code: result.code ?? "CONVERSION_FAILED" },
          { status: 503 }
        )
      }
      count = result.count
    }

    return NextResponse.json({ count })
  } catch (err) {
    console.error("[slides/slide-image/count]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get slide count" },
      { status: 500 }
    )
  }
}
