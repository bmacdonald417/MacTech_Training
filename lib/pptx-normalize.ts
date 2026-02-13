/**
 * Normalize a PPTX buffer so the pptx-preview library can render it.
 * Injects a default background (p:bg) into slides, layouts, and masters that lack it
 * to avoid "Cannot read properties of undefined (reading 'background')".
 */

import JSZip from "jszip"

/** Minimal OOXML background: solid white + effect list so parsers get a defined object. */
const DEFAULT_BG =
  '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>'

/** Match opening p:cSld tag (allows newlines and attributes). */
const cSldOpenRegex = /<p:cSld(\s[^>]*)?>/s

function injectBackgroundIfMissing(xml: string): string {
  if (xml.includes("<p:bg>")) return xml
  if (!xml.includes("cSld")) return xml
  return xml.replace(cSldOpenRegex, (match) => match + DEFAULT_BG)
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

  for (const path of [...slidePaths, ...layoutPaths, ...masterPaths]) {
    const file = zip.file(path)
    if (!file) continue
    const xml = await file.async("string")
    const updated = injectBackgroundIfMissing(xml)
    if (updated !== xml) {
      zip.file(path, updated)
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
