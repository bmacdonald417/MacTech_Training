/**
 * Server-side PPTX parsing: extract slide order, text per slide, and speaker notes.
 * Handles OOXML (zip + XML). Graceful fallback if layout detection fails.
 */

import JSZip from "jszip"
import { XMLParser } from "fast-xml-parser"

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25MB

export type ParsedSlide = {
  title: string
  body: string
  notes: string
}

export type ParsePptxResult = {
  ok: true
  slides: ParsedSlide[]
  warnings?: string[]
}

export type ParsePptxError = {
  ok: false
  message: string
}

export function getPptxMimeType(): string {
  return PPTX_MIME
}

export function getMaxPptxSizeBytes(): number {
  return MAX_FILE_SIZE_BYTES
}

/**
 * Only collect from DrawingML <a:t> (text run) elements so we don't pick up
 * XML metadata, attribute values, or schema text (e.g. "1.0", "UTF-8", "rect").
 * When the parser nests content as { "a:t": { "#text": "..." } }, we collect
 * "#text" only when we're inside an "a:t" or "t" element.
 */
const TEXT_RUN_KEYS = new Set(["a:t", "t"])

function collectTextFromNode(
  node: unknown,
  texts: string[],
  insideTextRun = false
): void {
  if (node == null) return
  if (typeof node === "string") {
    if (insideTextRun && node.trim()) texts.push(node.trim())
    return
  }
  if (Array.isArray(node)) {
    node.forEach((n) => collectTextFromNode(n, texts, insideTextRun))
    return
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>
    for (const [key, value] of Object.entries(obj)) {
      if (TEXT_RUN_KEYS.has(key)) {
        if (typeof value === "string" && value.trim()) {
          texts.push(value.trim())
        } else if (Array.isArray(value)) {
          value.forEach((v) => {
            if (typeof v === "string" && v.trim()) texts.push(v.trim())
          })
        } else {
          collectTextFromNode(value, texts, true)
        }
      } else if (key === "#text" && insideTextRun && typeof value === "string" && value.trim()) {
        texts.push(value.trim())
      } else {
        collectTextFromNode(value, texts, false)
      }
    }
  }
}

/** Normalize zip path for lookup: lowercase, forward slashes. */
function normPath(name: string): string {
  return name.replace(/\\/g, "/").toLowerCase()
}

/** Find a zip entry by path (case-insensitive, accepts / or \). */
function findZipFile(zip: JSZip, want: string): JSZip.JSZipObject | null {
  const wantNorm = normPath(want)
  for (const [name, entry] of Object.entries(zip.files)) {
    if (normPath(name) === wantNorm) return entry
  }
  return null
}

/** Get string from object with multiple possible keys (XML attr variants). */
function getAttr(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return undefined
}

/**
 * Extract ordered slide part paths from presentation.xml and its rels.
 */
async function getOrderedSlidePaths(
  zip: JSZip
): Promise<{ path: string; index: number }[]> {
  const prFile = findZipFile(zip, "ppt/presentation.xml")
  const relsFile = findZipFile(zip, "ppt/_rels/presentation.xml.rels")
  if (!prFile || !relsFile) return []

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: false,
  })

  const relsXml = await relsFile.async("string")
  const rels = parser.parse(relsXml) as { Relationships?: { Relationship?: unknown } }
  const relsList = rels.Relationships?.Relationship
  const relArray = Array.isArray(relsList) ? relsList : relsList ? [relsList] : []
  const idToTarget = new Map<string, string>()
  for (const r of relArray) {
    const rel = r as Record<string, string>
    const id = getAttr(rel, "@_Id", "@_id", "Id", "id")
    const target = getAttr(rel, "@_Target", "@_target", "Target", "target")
    if (!id || !target) continue
    const targetNorm = target.replace(/\\/g, "/")
    if (targetNorm.toLowerCase().startsWith("slides/")) {
      idToTarget.set(id, "ppt/" + targetNorm)
    } else if (targetNorm.startsWith("../")) {
      idToTarget.set(id, "ppt/" + targetNorm.replace(/^\.\.\//, ""))
    } else {
      idToTarget.set(id, "ppt/" + targetNorm)
    }
  }

  const prXml = await prFile.async("string")
  const pr = parser.parse(prXml) as Record<string, unknown>
  const presentation = pr["p:presentation"] ?? pr["presentation"]
  const pres = presentation && typeof presentation === "object" ? (presentation as Record<string, unknown>) : null
  const sldIdLstObj = pres?.["p:sldIdLst"] ?? pres?.["sldIdLst"]
  const sldIdLst = (sldIdLstObj as Record<string, unknown>)?.["p:sldId"] ?? (sldIdLstObj as Record<string, unknown>)?.["sldId"]
  const sldIds = Array.isArray(sldIdLst) ? sldIdLst : sldIdLst ? [sldIdLst] : []
  const ordered: { path: string; index: number }[] = []
  const pathToActualKey = new Map<string, string>()
  for (const name of Object.keys(zip.files)) {
    pathToActualKey.set(normPath(name), name)
  }
  sldIds.forEach((s, i) => {
    const slide = s as Record<string, string>
    const rId = getAttr(slide, "@_r:id", "r:id")
    const targetPath = rId ? idToTarget.get(rId) : undefined
    if (!targetPath) return
    const actualKey = pathToActualKey.get(normPath(targetPath)) ?? targetPath
    ordered.push({ path: actualKey, index: i + 1 })
  })
  return ordered
}

/**
 * Extract all text from a slide XML (slideN.xml) in order.
 */
async function extractTextFromSlideXml(zip: JSZip, slidePath: string): Promise<string[]> {
  const file = zip.file(slidePath) ?? findZipFile(zip, slidePath)
  if (!file) return []
  const xml = await file.async("string")
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: false,
  })
  const parsed = parser.parse(xml) as Record<string, unknown>
  const texts: string[] = []
  collectTextFromNode(parsed, texts)
  return texts
}

/**
 * Extract text from notes slide XML (notesSlideN.xml).
 */
async function extractNotesFromZip(zip: JSZip, slideIndex: number): Promise<string> {
  const path = `ppt/notesSlides/notesSlide${slideIndex}.xml`
  const file = zip.file(path) ?? findZipFile(zip, path)
  if (!file) return ""
  const xml = await file.async("string")
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: false,
  })
  const parsed = parser.parse(xml) as Record<string, unknown>
  const texts: string[] = []
  collectTextFromNode(parsed, texts)
  return texts.join("\n").trim()
}

/**
 * Heuristic: first text block = title, rest = body (bulleted list style).
 */
function toTitleAndBody(texts: string[]): { title: string; body: string } {
  if (texts.length === 0) return { title: "Untitled Slide", body: "" }
  if (texts.length === 1) {
    const t = texts[0]
    if (t.length > 80) return { title: "Slide", body: t }
    return { title: t, body: "" }
  }
  const title = texts[0]
  const body = texts.slice(1).map((line) => `- ${line}`).join("\n")
  return { title, body }
}

/**
 * Parse a PPTX buffer into ordered slides with title, body, and notes.
 */
export async function parsePptxBuffer(
  buffer: Buffer
): Promise<ParsePptxResult | ParsePptxError> {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { ok: false, message: "File too large. Maximum size is 25MB." }
  }

  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(buffer)
  } catch {
    return { ok: false, message: "Invalid or corrupted PPTX file." }
  }

  const ordered = await getOrderedSlidePaths(zip)
  const warnings: string[] = []

  let pathsWithIndex: { path: string; index: number }[] = ordered
  if (ordered.length === 0) {
    const slideNames = Object.keys(zip.files).filter(
      (n) => /^ppt[\/\\]slides[\/\\]slide\d+\.xml$/i.test(normPath(n))
    )
    slideNames.sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ""), 10)
      const nb = parseInt(b.replace(/\D/g, ""), 10)
      return na - nb
    })
    pathsWithIndex = slideNames.map((path, i) => ({ path, index: i + 1 }))
    if (pathsWithIndex.length === 0) {
      return {
        ok: false,
        message: "No slides found in this presentation.",
      }
    }
    warnings.push("Slide order was inferred from file names.")
  }

  const slides: ParsedSlide[] = []
  for (let i = 0; i < pathsWithIndex.length; i++) {
    const { path } = pathsWithIndex[i]
    let texts: string[]
    try {
      texts = await extractTextFromSlideXml(zip, path)
    } catch {
      texts = []
      warnings.push(`Slide ${i + 1}: could not read content; imported as empty.`)
    }
    const { title, body } = toTitleAndBody(texts)
    const notes = await extractNotesFromZip(zip, i + 1)
    slides.push({ title: title || `Slide ${i + 1}`, body, notes })
  }

  if (slides.length === 0) {
    return {
      ok: false,
      message: "No slide content could be extracted.",
    }
  }

  return {
    ok: true,
    slides,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}
