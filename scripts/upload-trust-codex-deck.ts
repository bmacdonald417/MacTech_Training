/**
 * Upload the MacTech Trust Codex CMMC slide deck into the training site.
 * Parses the PPTX, generates narrator notes from title+body when missing,
 * creates StoredFile + ContentItem + SlideDeck + Slides.
 *
 * Usage (from project root):
 *   npx tsx scripts/upload-trust-codex-deck.ts [path-to.pptx] [org-slug]
 *
 * Defaults:
 *   path: components/training/MacTech_Trust_Codex_—_CMMC_Accelerator_&_CUI_Vault_Enclave.pptx
 *   org: demo
 */

import path from "path"
import fs from "fs"
import { config } from "dotenv"

const root = path.resolve(__dirname, "..")
config({ path: path.join(root, ".env") })
config({ path: path.join(root, ".env.local") })

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.")
  console.error("Create a .env file in the project root with DATABASE_URL=your_postgres_url")
  console.error("Then run: npm run trust-codex:all")
  process.exit(1)
}

import { PrismaClient, ContentType } from "@prisma/client"
import { parsePptxBuffer, getPptxMimeType } from "../lib/pptx-parser"
import { writeStoredFile } from "../lib/stored-file-storage"
import { getSlideNarrationText } from "../lib/tts-text"
import { nanoid } from "nanoid"

const DEFAULT_PPTX_NAME =
  "MacTech_Trust_Codex_—_CMMC_Accelerator_&_CUI_Vault_Enclave.pptx"

async function main() {
  const projectRoot = path.resolve(__dirname, "..")
  const defaultPptxPath = path.join(
    projectRoot,
    "components",
    "training",
    DEFAULT_PPTX_NAME
  )
  const pptxPath = process.argv[2] || defaultPptxPath
  const orgSlug = process.argv[3] || "demo"

  const absolutePath = path.isAbsolute(pptxPath)
    ? pptxPath
    : path.join(process.cwd(), pptxPath)

  if (!fs.existsSync(absolutePath)) {
    console.error("PPTX file not found:", absolutePath)
    process.exit(1)
  }

  const buffer = fs.readFileSync(absolutePath)
  const parseResult = await parsePptxBuffer(buffer)
  if (!parseResult.ok) {
    console.error("Parse error:", parseResult.message)
    process.exit(1)
  }

  const { slides: parsedSlides, warnings } = parseResult
  const slidesWithNotes = parsedSlides.map((s, i) => ({
    ...s,
    notes:
      (s.notes?.trim() ||
        getSlideNarrationText(i, s.title, s.body, null)).trim() || undefined,
  }))

  const prisma = new PrismaClient()
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  })
  if (!org) {
    console.error("Organization not found for slug:", orgSlug)
    process.exit(1)
  }

  const filename = path.basename(absolutePath)
  const fileId = nanoid()
  const storagePath = await writeStoredFile(org.id, fileId, filename, buffer)

  const storedFile = await prisma.storedFile.create({
    data: {
      orgId: org.id,
      filename,
      mimeType: getPptxMimeType(),
      sizeBytes: buffer.length,
      storagePath,
      createdByMembershipId: null,
    },
  })

  const deckTitle =
    filename.replace(/\.pptx$/i, "").trim() || "Imported presentation"

  const contentItem = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      type: ContentType.SLIDE_DECK,
      title: deckTitle,
      description: warnings?.length
        ? "This PPTX contains unsupported elements; imported text only."
        : null,
    },
  })

  const slideDeck = await prisma.slideDeck.create({
    data: { contentItemId: contentItem.id, sourceFileId: storedFile.id },
  })

  await prisma.slide.createMany({
    data: slidesWithNotes.map((s, i) => ({
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

  console.log("Uploaded slide deck:")
  console.log("  Content item ID:", contentItem.id)
  console.log("  Slide deck ID:  ", slideDeck.id)
  console.log("  Title:          ", deckTitle)
  console.log("  Slides:         ", slidesWithNotes.length)
  if (warnings?.length) {
    console.log("  Warnings:       ", warnings.join("; "))
  }
  console.log(
    "\nEdit in trainer:",
    `/org/${orgSlug}/trainer/content/${contentItem.id}/edit`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    // PrismaClient doesn't need explicit disconnect for script exit
  })
