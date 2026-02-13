/**
 * Generate MP3 narrator files for every slide in the Trust Codex deck
 * and save them to Railway narration storage (RAILWAY_VOLUME_MOUNT_PATH).
 * Also upserts NarrationAsset so the app can stream the files.
 *
 * Prerequisites:
 *   - Trust Codex deck must already be uploaded (run upload-trust-codex first)
 *   - DATABASE_URL, OPENAI_API_KEY set
 *   - RAILWAY_VOLUME_MOUNT_PATH set (or ./tmp/narration for local dev)
 *
 * Usage:
 *   npx tsx scripts/generate-trust-codex-narration-mp3s.ts [org-slug]
 *   npx tsx scripts/generate-trust-codex-narration-mp3s.ts demo
 */

import path from "path"
import { config } from "dotenv"
import { PrismaClient } from "@prisma/client"

config({ path: path.resolve(__dirname, "..", ".env") })
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env and run again.")
  process.exit(1)
}
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set. Required for TTS. Add it to .env and run again.")
  process.exit(1)
}
import { getSlideNarrationText } from "../lib/tts-text"
import { generateTtsMp3, MAX_TTS_INPUT_LENGTH } from "../lib/tts-openai"
import { writeNarrationFile } from "../lib/narration-storage"

const ORG_SLUG = process.argv[2] || "demo"
const VOICE = "alloy"
const TRUST_CODEX_TITLE_MATCH = "Trust Codex"

async function main() {
  const prisma = new PrismaClient()

  const org = await prisma.organization.findUnique({
    where: { slug: ORG_SLUG },
  })
  if (!org) {
    console.error("Organization not found for slug:", ORG_SLUG)
    process.exit(1)
  }

  const contentItem = await prisma.contentItem.findFirst({
    where: {
      orgId: org.id,
      type: "SLIDE_DECK",
      title: { contains: TRUST_CODEX_TITLE_MATCH, mode: "insensitive" },
    },
    include: { slideDeck: { include: { slides: { orderBy: { order: "asc" } } } } },
  })

  if (!contentItem?.slideDeck?.slides?.length) {
    console.error(
      "No slide deck found with title containing:",
      TRUST_CODEX_TITLE_MATCH
    )
    console.error(
      "Upload the deck first: npm run upload-trust-codex"
    )
    process.exit(1)
  }

  const slides = contentItem.slideDeck.slides
  console.log(
    "Found deck:",
    contentItem.title,
    "| Slides:",
    slides.length,
    "| Org:",
    ORG_SLUG
  )
  console.log("Narration storage:", process.env.RAILWAY_VOLUME_MOUNT_PATH || "./tmp/narration (local)")
  console.log("")

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const text = getSlideNarrationText(
      i,
      slide.title,
      slide.content,
      slide.notesRichText
    )
    const trimmed = text.slice(0, MAX_TTS_INPUT_LENGTH).trim()
    if (!trimmed) {
      console.log(`Slide ${i + 1}: [skip] no text`)
      continue
    }

    process.stdout.write(`Slide ${i + 1}/${slides.length}: ${slide.title.slice(0, 40)}... `)
    const result = await generateTtsMp3(trimmed, VOICE)
    if (!result.ok) {
      console.error("FAIL:", result.error)
      continue
    }

    const storagePath = await writeNarrationFile(
      org.id,
      "SLIDE",
      slide.id,
      result.buffer
    )

    await prisma.narrationAsset.upsert({
      where: {
        orgId_entityType_entityId: {
          orgId: org.id,
          entityType: "SLIDE",
          entityId: slide.id,
        },
      },
      update: {
        storagePath,
        voice: VOICE,
        inputText: trimmed,
        updatedAt: new Date(),
      },
      create: {
        orgId: org.id,
        entityType: "SLIDE",
        entityId: slide.id,
        voice: VOICE,
        format: "mp3",
        storagePath,
        inputText: trimmed,
      },
    })

    console.log("OK")
  }

  console.log("")
  console.log("Done. All", slides.length, "narration MP3s saved to Railway storage.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    // PrismaClient will exit when process exits
  })
