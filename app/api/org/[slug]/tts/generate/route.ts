import { NextRequest, NextResponse } from "next/server"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { writeNarrationFile } from "@/lib/narration-storage"
import { getSlideNarrationText, getArticleNarrationText } from "@/lib/tts-text"

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"
const TTS_MODEL_PREFERRED = "gpt-4o-mini-tts"
const TTS_MODEL_FALLBACK = "tts-1"
const VOICE = "alloy"
const MAX_INPUT_LENGTH = 4096

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const membership = await requireTrainerOrAdmin(params.slug)
    const body = await req.json()
    const { entityType, entityId } = body as { entityType?: string; entityId?: string }

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

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "TTS is not configured. OPENAI_API_KEY is missing." },
        { status: 503 }
      )
    }

    let textToSpeak: string

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
        slide.content
      )
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
      textToSpeak = getArticleNarrationText(
        contentItem.title,
        contentItem.article.content
      )
    } else {
      return NextResponse.json(
        { error: "SLIDE_DECK narration not implemented; use SLIDE per slide" },
        { status: 400 }
      )
    }

    const trimmed = textToSpeak.slice(0, MAX_INPUT_LENGTH)
    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: "No text content to convert to speech" },
        { status: 400 }
      )
    }

    let buffer: Buffer
    let modelUsed = TTS_MODEL_PREFERRED

    try {
      const res = await fetch(OPENAI_TTS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: TTS_MODEL_PREFERRED,
          input: trimmed,
          voice: VOICE,
          response_format: "mp3",
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        if (res.status === 404 || errText.includes("model") || errText.includes("gpt-4o-mini-tts")) {
          const fallback = await fetch(OPENAI_TTS_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: TTS_MODEL_FALLBACK,
              input: trimmed,
              voice: VOICE,
              response_format: "mp3",
            }),
          })
          if (!fallback.ok) {
            const fallbackText = await fallback.text()
            console.error("[tts/generate] OpenAI fallback failed:", fallback.status, fallbackText)
            return NextResponse.json(
              { error: "Text-to-speech failed. Please try again later." },
              { status: 502 }
            )
          }
          modelUsed = TTS_MODEL_FALLBACK
          buffer = Buffer.from(await fallback.arrayBuffer())
        } else {
          console.error("[tts/generate] OpenAI error:", res.status, errText)
          return NextResponse.json(
            { error: "Text-to-speech failed. Please try again later." },
            { status: 502 }
          )
        }
      } else {
        buffer = Buffer.from(await res.arrayBuffer())
      }
    } catch (e) {
      console.error("[tts/generate] OpenAI request error:", e)
      return NextResponse.json(
        { error: "Text-to-speech service unavailable. Please try again later." },
        { status: 502 }
      )
    }

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
        voice: VOICE,
      },
      create: {
        orgId: membership.orgId,
        entityType: entityType as "SLIDE" | "SLIDE_DECK" | "ARTICLE",
        entityId,
        voice: VOICE,
        format: "mp3",
        storagePath,
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
          voice: VOICE,
          storagePath,
        }),
      },
    })

    const streamUrl = `/api/org/${params.slug}/narration/stream?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&v=${now.getTime()}`

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
