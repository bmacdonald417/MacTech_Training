import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { resolveAbsolutePath } from "@/lib/narration-storage"
import fs from "fs"

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
      return NextResponse.json({ error: "Narration not found" }, { status: 404 })
    }

    const absolutePath = resolveAbsolutePath(asset.storagePath)
    try {
      await fs.promises.access(absolutePath, fs.constants.R_OK)
    } catch {
      return NextResponse.json(
        { error: "Narration file not found on disk" },
        { status: 404 }
      )
    }

    const stat = await fs.promises.stat(absolutePath)
    const fileSize = stat.size
    const rangeHeader = req.headers.get("range")

    const headers: Record<string, string> = {
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-cache",
    }

    if (rangeHeader?.startsWith("bytes=")) {
      const parts = rangeHeader.replace("bytes=", "").split("-")
      const start = parseInt(parts[0], 10) || 0
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkStart = Math.min(start, fileSize - 1)
      const chunkEnd = Math.min(end, fileSize - 1)
      const chunkLength = chunkEnd - chunkStart + 1

      if (chunkStart >= fileSize || chunkEnd < chunkStart) {
        return NextResponse.json(
          { error: "Invalid range" },
          { status: 416, headers: { "Content-Range": `bytes */${fileSize}` } }
        )
      }

      headers["Content-Range"] = `bytes ${chunkStart}-${chunkEnd}/${fileSize}`
      headers["Content-Length"] = String(chunkLength)

      const nodeStream = fs.createReadStream(absolutePath, {
        start: chunkStart,
        end: chunkEnd,
      })
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk: string | Buffer) => {
            const bytes =
              chunk instanceof Buffer
                ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
                : new Uint8Array(Buffer.from(chunk as string, "binary"))
            controller.enqueue(bytes)
          })
          nodeStream.on("end", () => controller.close())
          nodeStream.on("error", (err) => controller.error(err))
        },
        cancel() {
          nodeStream.destroy()
        },
      })
      return new NextResponse(webStream, {
        status: 206,
        headers,
      })
    }

    headers["Content-Length"] = String(fileSize)
    const nodeStream = fs.createReadStream(absolutePath)
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: string | Buffer) => {
            const bytes =
              chunk instanceof Buffer
                ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
                : new Uint8Array(Buffer.from(chunk as string, "binary"))
            controller.enqueue(bytes)
          })
        nodeStream.on("end", () => controller.close())
        nodeStream.on("error", (err) => controller.error(err))
      },
      cancel() {
        nodeStream.destroy()
      },
    })
    return new NextResponse(webStream, {
      status: 200,
      headers,
    })
  } catch (e) {
    if (String(e).includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[narration/stream]", e)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
