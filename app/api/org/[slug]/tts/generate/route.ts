import { NextRequest, NextResponse } from "next/server"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { writeNarrationFile } from "@/lib/narration-storage"
import { getSlideNarrationText, getArticleNarrationText } from "@/lib/tts-text"
import { generateTtsMp3, MAX_TTS_INPUT_LENGTH } from "@/lib/tts-openai"

const DEFAULT_VOICE = "alloy"
const ALLOWED_VOICES = new Set([
  "alloy",
  "nova",
  "shimmer",
  "echo",
  "onyx",
  "fable",
])

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const membership = await requireTrainerOrAdmin(slug)
    const body = await req.json()
    const { entityType, entityId, voice } = body as {
      entityType?: string
      entityId?: string
      voice?: string
      inputText?: string
    }

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

    const voiceToUse =
      typeof voice === "string" && ALLOWED_VOICES.has(voice) ? voice : DEFAULT_VOICE

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "TTS is not configured. OPENAI_API_KEY is missing." },
        { status: 503 }
      )
    }

    let textToSpeak: string
    const inputOverride =
      typeof (body as any)?.inputText === "string" ? ((body as any).inputText as string) : null

    if (entityType === "SLIDE") {
      const slide = await prisma.slide.findUnique({
        where: { id: entityId },
        include: {
          slideDeck: {
            include: { contentItem: true },
          },
        },
      })
      if (!slide?.slideDeck?.contentItem || slide.slideDeck.contentItem.orgId !== membership.orgId) {
        return NextResponse.json({ error: "Slide not found" }, { status: 404 })
      }
      if (inputOverride && inputOverride.trim()) {
        textToSpeak = inputOverride.trim()
      } else {
        const order = slide.slideDeck
          ? await prisma.slide
              .findMany({
                where: { slideDeckId: slide.slideDeckId },
                orderBy: { order: "asc" },
                select: { id: true },
              })
              .then((slides) => slides.findIndex((s) => s.id === slide.id))
          : 0
        const slideIndex = order >= 0 ? order : 0
        textToSpeak = getSlideNarrationText(
          slideIndex,
          slide.title,
          slide.content,
          slide.notesRichText
        )
      }
    } else if (entityType === "ARTICLE") {
      const contentItem = await prisma.contentItem.findFirst({
        where: {
          id: entityId,
          orgId: membership.orgId,
          type: "ARTICLE",
        },
        include: { article: true },
      })
      if (!contentItem?.article) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 })
      }
      if (inputOverride && inputOverride.trim()) {
        textToSpeak = inputOverride.trim()
      } else {
        textToSpeak = getArticleNarrationText(
          contentItem.title,
          contentItem.article.content
        )
      }
    } else {
      return NextResponse.json(
        { error: "SLIDE_DECK narration not implemented; use SLIDE per slide" },
        { status: 400 }
      )
    }

    const trimmed = textToSpeak.slice(0, MAX_TTS_INPUT_LENGTH)
    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: "No text content to convert to speech" },
        { status: 400 }
      )
    }

    const ttsResult = await generateTtsMp3(trimmed, voiceToUse)
    if (!ttsResult.ok) {
      if (ttsResult.error.includes("OPENAI_API_KEY")) {
        return NextResponse.json(
          { error: "TTS is not configured. OPENAI_API_KEY is missing." },
          { status: 503 }
        )
      }
      console.error("[tts/generate]", ttsResult.error)
      return NextResponse.json(
        { error: "Text-to-speech failed. Please try again later." },
        { status: 502 }
      )
    }
    const buffer = ttsResult.buffer
    const modelUsed = ttsResult.modelUsed

    let storagePath: string
    try {
      storagePath = await writeNarrationFile(
        membership.orgId,
        entityType,
        entityId,
        buffer
      )
    } catch (storageErr) {
      const message = storageErr instanceof Error ? storageErr.message : "Narration storage failed."
      console.error("[tts/generate] Storage error:", storageErr)
      return NextResponse.json(
        { error: message },
        { status: 503 }
      )
    }

    const now = new Date()
    const asset = await prisma.narrationAsset.upsert({
      where: {
        orgId_entityType_entityId: {
          orgId: membership.orgId,
          entityType: entityType as "SLIDE" | "SLIDE_DECK" | "ARTICLE",
          entityId,
        },
      },
      update: {
        storagePath,
        updatedAt: now,
        updatedByMembershipId: undefined,
        voice: voiceToUse,
        inputText: trimmed,
      },
      create: {
        orgId: membership.orgId,
        entityType: entityType as "SLIDE" | "SLIDE_DECK" | "ARTICLE",
        entityId,
        voice: voiceToUse,
        format: "mp3",
        storagePath,
        inputText: trimmed,
        updatedByMembershipId: undefined,
      },
    })

    await prisma.eventLog.create({
      data: {
        orgId: membership.orgId,
        userId: membership.userId,
        type: "NARRATION_GENERATED",
        metadata: JSON.stringify({
          entityType,
          entityId,
          voice: voiceToUse,
          model: modelUsed,
          storagePath,
        }),
      },
    })

    const streamUrl = `/api/org/${slug}/narration/stream?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&v=${now.getTime()}`

    return NextResponse.json({
      ok: true,
      updatedAt: now.toISOString(),
      streamUrl,
    })
  } catch (e) {
    if (String(e).includes("Forbidden") || String(e).includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Only admins and trainers can generate narration." },
        { status: 403 }
      )
    }
    console.error("[tts/generate]", e)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
