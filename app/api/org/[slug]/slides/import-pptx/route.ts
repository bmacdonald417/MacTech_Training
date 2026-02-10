import { NextRequest, NextResponse } from "next/server"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { ContentType } from "@prisma/client"
import { parsePptxBuffer, getPptxMimeType, getMaxPptxSizeBytes } from "@/lib/pptx-parser"
import { writeStoredFile } from "@/lib/stored-file-storage"
import { nanoid } from "nanoid"

const ALLOWED_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

/**
 * POST /api/org/[slug]/slides/import-pptx
 * Admin/Trainer only. multipart/form-data with file field "file" (.pptx).
 * Creates StoredFile, parses PPTX, creates ContentItem + SlideDeck + Slides.
 * Returns { contentItemId, slideDeckId, redirectUrl, warnings? }.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const membership = await requireTrainerOrAdmin(slug)

    const membershipRow = await prisma.membership.findUnique({
      where: { userId_orgId: { userId: membership.userId, orgId: membership.orgId } },
    })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Use form field 'file'." },
        { status: 400 }
      )
    }

    const contentType = file.type || ""
    if (
      contentType !== ALLOWED_MIME &&
      !contentType.includes("presentation") &&
      !file.name.toLowerCase().endsWith(".pptx")
    ) {
      return NextResponse.json(
        { error: "Invalid file type. Only .pptx files are allowed." },
        { status: 400 }
      )
    }

    if (file.size > getMaxPptxSizeBytes()) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${Math.round(getMaxPptxSizeBytes() / 1024 / 1024)}MB.` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parseResult = await parsePptxBuffer(buffer)
    if (!parseResult.ok) {
      return NextResponse.json(
        { error: parseResult.message },
        { status: 400 }
      )
    }

    const { slides: parsedSlides, warnings } = parseResult
    const contentItemIdParam = formData.get("contentItemId") as string | null
    const slideDeckIdParam = formData.get("slideDeckId") as string | null

    // Update existing deck in place when both IDs provided and owned by org
    if (contentItemIdParam?.trim() && slideDeckIdParam?.trim()) {
      const contentItem = await prisma.contentItem.findFirst({
        where: {
          id: contentItemIdParam.trim(),
          orgId: membership.orgId,
          type: ContentType.SLIDE_DECK,
        },
        include: { slideDeck: true },
      })
      if (contentItem?.slideDeck?.id === slideDeckIdParam.trim()) {
        await prisma.slide.deleteMany({
          where: { slideDeckId: contentItem.slideDeck.id },
        })
        await prisma.slide.createMany({
          data: parsedSlides.map((s, i) => ({
            slideDeckId: contentItem.slideDeck!.id,
            title: s.title,
            content: s.body,
            notesRichText: s.notes || null,
            order: i + 1,
            layoutType: "TITLE_AND_BODY",
            importedFromPptx: true,
          })),
        })
        const slidesForClient = parsedSlides.map((s, i) => ({
          title: s.title,
          content: s.body,
          order: i + 1,
          layoutType: "TITLE_AND_BODY" as const,
          notesRichText: s.notes || null,
        }))
        return NextResponse.json({
          updated: true,
          slides: slidesForClient,
          redirectUrl: `/org/${slug}/trainer/content/${contentItemIdParam}/edit`,
          warnings: warnings?.length ? warnings : undefined,
        })
      }
    }

    // Create new content item + slide deck
    const deckTitle =
      file.name.replace(/\.pptx$/i, "").trim() || "Imported presentation"

    const fileId = nanoid()
    const storagePath = await writeStoredFile(
      membership.orgId,
      fileId,
      file.name,
      buffer
    )

    const storedFile = await prisma.storedFile.create({
      data: {
        orgId: membership.orgId,
        filename: file.name,
        mimeType: getPptxMimeType(),
        sizeBytes: file.size,
        storagePath,
        createdByMembershipId: membershipRow?.id ?? null,
      },
    })

    const contentItem = await prisma.contentItem.create({
      data: {
        orgId: membership.orgId,
        type: ContentType.SLIDE_DECK,
        title: deckTitle,
        description: warnings?.length
          ? "This PPTX contains unsupported elements; imported text only."
          : null,
      },
    })

    const slideDeck = await prisma.slideDeck.create({
      data: { contentItemId: contentItem.id },
    })

    await prisma.slide.createMany({
      data: parsedSlides.map((s, i) => ({
        slideDeckId: slideDeck.id,
        title: s.title,
        content: s.body,
        notesRichText: s.notes || null,
        order: i + 1,
        layoutType: "TITLE_AND_BODY",
        importedFromPptx: true,
        sourceFileId: storedFile.id,
      })),
    })

    const redirectUrl = `/org/${slug}/trainer/content/${contentItem.id}/edit`

    return NextResponse.json({
      contentItemId: contentItem.id,
      slideDeckId: slideDeck.id,
      redirectUrl,
      warnings: warnings?.length ? warnings : undefined,
    })
  } catch (err) {
    console.error("[import-pptx]", err)
    const message = err instanceof Error ? err.message : "Import failed"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
