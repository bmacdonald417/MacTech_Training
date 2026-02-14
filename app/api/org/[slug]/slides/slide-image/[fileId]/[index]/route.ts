import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { resolveStoredFileAbsolutePath } from "@/lib/stored-file-storage"
import fs from "fs"
import {
  getSlideImagePath,
  getExistingSlideImageCount,
  slideImageExists,
  generateSlideImages,
} from "@/lib/pptx-to-slide-images"

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"

/**
 * GET /api/org/[slug]/slides/slide-image/[fileId]/[index]
 * Serve the PNG for slide at index (0-based). Generates slide images on first request if missing.
 * Auth: any org member (same as slides/file).
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string; fileId: string; index: string }> }
) {
  try {
    const { slug, fileId, index: indexParam } = await context.params
    const membership = await requireAuth(slug)

    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, orgId: membership.orgId },
      select: { id: true, mimeType: true, filename: true, storagePath: true, contentBytes: true },
    })
    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 })
    }

    const index = parseInt(indexParam, 10)
    if (Number.isNaN(index) || index < 0) {
      return NextResponse.json({ error: "Invalid slide index." }, { status: 400 })
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
        console.warn("[slides/slide-image] generateSlideImages failed:", result.error)
        return NextResponse.json(
          { error: result.error, code: "CONVERSION_FAILED" },
          { status: 503 }
        )
      }
      count = result.count
    }

    if (index >= count) {
      return NextResponse.json({ error: "Slide index out of range." }, { status: 404 })
    }

    const exists = await slideImageExists(fileId, index)
    if (!exists) {
      return NextResponse.json({ error: "Slide image not found." }, { status: 404 })
    }

    const imagePath = getSlideImagePath(fileId, index)
    const buf = await fs.promises.readFile(imagePath)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=86400",
        "Content-Length": String(buf.byteLength),
      },
    })
  } catch (err) {
    console.error("[slides/slide-image] ERROR", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to serve slide image" },
      { status: 500 }
    )
  }
}
