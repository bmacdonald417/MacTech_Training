/**
 * Normalize a PPTX buffer so the pptx-preview library can render it.
 * Injects a default background (p:bg) into slides, layouts, and masters that lack it
 * to avoid "Cannot read properties of undefined (reading 'background')".
 */

import JSZip from "jszip"

/** Minimal OOXML background: solid white + effect list so parsers get a defined object. */
const DEFAULT_BG =
  '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>'

/** Match opening p:cSld tag (optional whitespace/attrs). */
const cSldOpenRegex = /<p:cSld(\s[^>]*)?>/

/**
 * Inject p:bg right after the opening cSld tag so the slide has a defined background.
 * Tries regex first; falls back to indexOf so odd XML (e.g. newlines, different formatting) still gets fixed.
 */
function injectBackgroundIfMissing(xml: string): string {
  if (xml.includes("<p:bg>")) return xml
  if (xml.indexOf("cSld") === -1) return xml

  const byRegex = xml.replace(cSldOpenRegex, (match) => match + DEFAULT_BG)
  if (byRegex !== xml) return byRegex

  const openIdx = xml.indexOf("<p:cSld")
  if (openIdx === -1) return xml
  const closeIdx = xml.indexOf(">", openIdx)
  if (closeIdx === -1) return xml
  return xml.slice(0, closeIdx + 1) + DEFAULT_BG + xml.slice(closeIdx + 1)
}

/**
 * Inject default p:bg into any slide, slide layout, or slide master XML that lacks it.
 * Returns a new buffer; does not mutate the input.
 */
export async function ensureSlideBackgrounds(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer)
  let changed = false

  const allNames = Object.keys(zip.files)
  const slidePaths = allNames.filter((name) =>
    /^ppt[\/\\]slides[\/\\]slide\d+\.xml$/i.test(name)
  )
  const layoutPaths = allNames.filter((name) =>
    /^ppt[\/\\]slideLayouts[\/\\]slideLayout\d+\.xml$/i.test(name)
  )
  const masterPaths = allNames.filter((name) =>
    /^ppt[\/\\]slideMasters[\/\\]slideMaster\d+\.xml$/i.test(name)
  )

  for (const filePath of [...slidePaths, ...layoutPaths, ...masterPaths]) {
    const file = zip.file(filePath)
    if (!file) continue
    const xml = await file.async("string")
    const updated = injectBackgroundIfMissing(xml)
    if (updated !== xml) {
      zip.file(filePath, updated)
      changed = true
    }
  }

  if (!changed) return buffer
  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })
  return Buffer.from(out)
}
