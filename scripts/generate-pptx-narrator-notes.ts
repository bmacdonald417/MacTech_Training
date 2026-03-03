/**
 * Parse a PPTX and generate narrator notes for each slide.
 * Outputs a Markdown file with slide number, title, and narrator note.
 *
 * Usage: npx tsx scripts/generate-pptx-narrator-notes.ts [path-to.pptx]
 */

import "dotenv/config"
import path from "path"
import fs from "fs"
import { parsePptxBuffer } from "../lib/pptx-parser"
import { getSlideNarrationText } from "../lib/tts-text"

const DEFAULT_PPTX =
  "components/training/MacTech_Trust_Codex_—_CMMC_Accelerator_&_CUI_Vault_Enclave.pptx"

async function main() {
  const projectRoot = path.resolve(__dirname, "..")
  const pptxPath = process.argv[2]
    ? path.isAbsolute(process.argv[2])
      ? process.argv[2]
      : path.join(process.cwd(), process.argv[2])
    : path.join(projectRoot, DEFAULT_PPTX)

  if (!fs.existsSync(pptxPath)) {
    console.error("File not found:", pptxPath)
    process.exit(1)
  }

  const buffer = fs.readFileSync(pptxPath)
  const result = await parsePptxBuffer(buffer)
  if (!result.ok) {
    console.error("Parse error:", result.message)
    process.exit(1)
  }

  const lines: string[] = [
    "# Narrator Notes — " + path.basename(pptxPath, ".pptx"),
    "",
    "Generated narrator script for each slide. Use as speaker notes or for TTS.",
    "",
    "---",
    "",
  ]

  result.slides.forEach((slide, i) => {
    const note = getSlideNarrationText(i, slide.title, slide.body, slide.notes)
    const hadNotes = (slide.notes || "").trim().length > 0
    lines.push(`## Slide ${i + 1}: ${slide.title}`)
    lines.push("")
    if (hadNotes) {
      lines.push("*Source: speaker notes from PPTX*")
      lines.push("")
    }
    lines.push(note)
    lines.push("")
    lines.push("---")
    lines.push("")
  })

  const outPath = pptxPath.replace(/\.pptx$/i, "_Narrator_Notes.md")
  fs.writeFileSync(outPath, lines.join("\n"), "utf8")
  console.log("Wrote narrator notes to:", outPath)
  console.log("Slides:", result.slides.length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
