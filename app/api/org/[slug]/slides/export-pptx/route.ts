import { NextRequest, NextResponse } from "next/server"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import PptxGenJS from "pptxgenjs"

const DARK_BG = "0F2438"
const LIGHT_TEXT = "F1F5F9"

/** Strip Markdown to plain text for PPTX body (headers, bold, bullets). */
function markdownToPlain(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .trim()
}

/**
 * GET /api/org/[slug]/slides/export-pptx?slideDeckId=...
 * Admin/Trainer only. Generates PPTX from SlideDeck (title, content, speaker notes).
 * Streams application/vnd.openxmlformats-officedocument.presentationml.presentation.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const membership = await requireTrainerOrAdmin(slug)

    const { searchParams } = new URL(req.url)
    const slideDeckId = searchParams.get("slideDeckId")
    if (!slideDeckId) {
      return NextResponse.json(
        { error: "Missing slideDeckId query parameter." },
        { status: 400 }
      )
    }

    const deck = await prisma.slideDeck.findFirst({
      where: { id: slideDeckId },
      include: {
        contentItem: true,
        slides: { orderBy: { order: "asc" } },
      },
    })

    if (!deck || !deck.contentItem) {
      return NextResponse.json(
        { error: "Slide deck not found." },
        { status: 404 }
      )
    }

    if (deck.contentItem.orgId !== membership.orgId) {
      return NextResponse.json(
        { error: "Slide deck not found." },
        { status: 404 }
      )
    }

    const pptx = new PptxGenJS()
    pptx.title = deck.contentItem.title
    pptx.author = "MacTech Training"

    for (const slide of deck.slides) {
      const slideObj = pptx.addSlide()
      ;(slideObj as { background?: { color: string } }).background = { color: DARK_BG }

      slideObj.addText(slide.title, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.75,
        fontSize: 24,
        bold: true,
        color: LIGHT_TEXT,
      })

      const rawBody = (slide.content || "").trim()
      if (rawBody) {
        const plainBody = markdownToPlain(rawBody)
        const bullets = plainBody
          .split(/\n+/)
          .map((line) => line.replace(/^[\-\*]\s*/, "").trim())
          .filter(Boolean)
        const bulletText = bullets.length ? bullets.join("\n") : plainBody
        slideObj.addText(bulletText, {
          x: 0.5,
          y: 1.4,
          w: 9,
          h: 5,
          fontSize: 14,
          color: LIGHT_TEXT,
          bullet: bullets.length > 1,
        })
      }

      const notes = (slide.notesRichText || "").trim()
      if (notes) {
        slideObj.addNotes(notes)
      }
    }

    const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer
    const filename = `${(deck.contentItem.title || "export").replace(/[^\w\-]/g, "_")}.pptx`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    })
  } catch (err) {
    console.error("[export-pptx]", err)
    const message = err instanceof Error ? err.message : "Export failed"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
