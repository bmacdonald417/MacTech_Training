/**
 * Local test: normalize the Trust Codex PPTX, verify XML, then run pptx-preview
 * to capture the actual error. Run: npx tsx scripts/test-pptx-normalize-and-preview.ts
 */
import * as fs from "fs"
import * as path from "path"
import { ensureSlideBackgrounds } from "../lib/pptx-normalize"
import JSZip from "jszip"

const PPTX_PATH = path.join(
  __dirname,
  "../components/training/MacTech_Trust_Codex_—_CMMC_Accelerator_&_CUI_Vault_Enclave_2.pptx"
)
const OUT_DIR = path.join(__dirname, "../public")
const NORMALIZED_PPTX = path.join(OUT_DIR, "test-normalized.pptx")

async function main() {
  console.log("Reading PPTX:", PPTX_PATH)
  const raw = fs.readFileSync(PPTX_PATH)
  console.log("Size:", raw.length)

  console.log("\nRunning ensureSlideBackgrounds()...")
  const normalized = await ensureSlideBackgrounds(raw)
  console.log("Normalized size:", normalized.length, normalized.length !== raw.length ? "(changed)" : "(unchanged)")

  // Verify: extract slide1 and slideLayout1 from normalized zip and show snippet
  const zip = await JSZip.loadAsync(normalized)
  const slide1 = zip.file("ppt/slides/slide1.xml")
  const layout1 = zip.file("ppt/slideLayouts/slideLayout1.xml")
  const master1 = zip.file("ppt/slideMasters/slideMaster1.xml")

  for (const [name, file] of [
    ["ppt/slides/slide1.xml", slide1],
    ["ppt/slideLayouts/slideLayout1.xml", layout1],
    ["ppt/slideMasters/slideMaster1.xml", master1],
  ] as const) {
    if (!file) {
      console.log("\n" + name + ": (not found)")
      continue
    }
    const xml = await file.async("string")
    const hasBg = xml.includes("<p:bg>") && xml.includes("a:srgbClr")
    const hasBgRef = xml.includes("bgRef") || xml.includes("schemeClr")
    console.log("\n" + name + ":")
    console.log("  has <p:bg> + a:srgbClr:", hasBg)
    console.log("  still has bgRef/schemeClr:", hasBgRef)
    console.log("  snippet:", xml.slice(0, 400).replace(/\s+/g, " ") + "...")
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(NORMALIZED_PPTX, normalized)
  console.log("\nWrote normalized PPTX to:", NORMALIZED_PPTX)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
