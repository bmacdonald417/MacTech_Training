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
      select: {
        id: true,
        mimeType: true,
        filename: true,
        storagePath: true,
        contentBytes: true,
      },
    })
    if (!file) {
      console.warn("[slides/file] File not found.", { fileId, orgId: membership.orgId })
      return NextResponse.json({ error: "File not found." }, { status: 404 })
    }

    let buffer: Buffer
    if (file.storagePath === "db" && file.contentBytes && file.contentBytes.length > 0) {
      buffer = Buffer.isBuffer(file.contentBytes)
        ? file.contentBytes
        : Buffer.from(file.contentBytes as ArrayBuffer)
    } else {
      const fullPath = resolveStoredFileAbsolutePath(file.storagePath)
      try {
        buffer = await fs.promises.readFile(fullPath)
      } catch (e) {
        console.warn("[slides/file] File missing on disk.", {
          fileId,
          storagePath: file.storagePath,
          err: e instanceof Error ? e.message : String(e),
        })
        return NextResponse.json(
          { error: "File not found on disk.", code: "FILE_MISSING_ON_DISK" },
          { status: 404 }
        )
      }
    }

    const skipNormalize = req.nextUrl.searchParams.get("raw") === "1"
    if (skipNormalize) {
      console.info("[slides/file] Serving raw PPTX (normalization skipped).", { fileId })
    }
    const originalLength = buffer.byteLength
    if (
      !skipNormalize &&
      (file.mimeType === PPTX_MIME || file.filename?.toLowerCase().endsWith(".pptx"))
    ) {
      try {
        const normalized = await ensureSlideBackgrounds(buffer)
        // Only use normalized result if it looks valid (avoid serving corrupted ZIP)
        if (
          normalized &&
          normalized.byteLength >= 100 &&
          normalized.byteLength >= originalLength * 0.5
        ) {
          buffer = normalized
          console.info("[slides/file] Serving normalized PPTX.", {
            fileId,
            originalBytes: originalLength,
            normalizedBytes: buffer.byteLength,
          })
        } else {
          console.info("[slides/file] Serving original PPTX (normalized skipped: invalid or unchanged).", {
            fileId,
            originalBytes: originalLength,
            normalizedBytes: normalized?.byteLength ?? 0,
          })
        }
      } catch (e) {
        console.warn("[slides/file] pptx normalize failed, serving original:", e)
      }
    }

    if (!buffer || buffer.byteLength < 100) {
      console.warn("[slides/file] FILE_EMPTY: stored file empty or invalid.", {
        fileId,
        byteLength: buffer?.byteLength ?? 0,
      })
      return NextResponse.json(
        { error: "Stored file is empty or invalid.", code: "FILE_EMPTY" },
        { status: 404 }
      )
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename ?? "presentation.pptx")}"`,
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
