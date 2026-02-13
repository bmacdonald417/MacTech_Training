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
/** Match any namespace prefix + cSld (e.g. p:cSld, x:cSld). */
const cSldAnyNsRegex = /<[^:>]*:cSld(\s[^>]*)?>/

/**
 * Replace p:bg that only has a theme reference (p:bgRef) with an inline solid fill.
 * pptx-preview can't resolve bgRef and ends up with undefined .background.
 */
function replaceBgRefWithSolid(xml: string): string {
  if (!xml.includes("<p:bg>") || !xml.includes("bgRef")) return xml
  if (xml.includes("a:solidFill") || xml.includes("a:blipFill")) return xml
  return xml.replace(/<p:bg>[\s\S]*?<\/p:bg>/g, (match) => {
    if (match.includes("bgRef") && !match.includes("a:solidFill") && !match.includes("a:blipFill")) return DEFAULT_BG
    return match
  })
}

/**
 * Inject p:bg right after the opening cSld tag so the slide has a defined background.
 * Also replaces theme-only p:bg (bgRef) with inline fill so the viewer gets a concrete background.
 */
function injectBackgroundIfMissing(xml: string): string {
  if (xml.indexOf("cSld") === -1) return xml

  let out = replaceBgRefWithSolid(xml)
  if (out !== xml) return out

  if (xml.includes("<p:bg>")) return xml

  out = xml.replace(cSldOpenRegex, (match) => match + DEFAULT_BG)
  if (out !== xml) return out
  out = xml.replace(cSldAnyNsRegex, (match) => match + DEFAULT_BG)
  if (out !== xml) return out

  const openIdx = xml.indexOf("<p:cSld")
  if (openIdx !== -1) {
    const closeIdx = xml.indexOf(">", openIdx)
    if (closeIdx !== -1) return xml.slice(0, closeIdx + 1) + DEFAULT_BG + xml.slice(closeIdx + 1)
  }
  const cSldIdx = xml.indexOf("cSld")
  if (cSldIdx !== -1) {
    const open = xml.lastIndexOf("<", cSldIdx)
    const close = xml.indexOf(">", cSldIdx)
    if (open !== -1 && close !== -1 && close > open) return xml.slice(0, close + 1) + DEFAULT_BG + xml.slice(close + 1)
  }
  return xml
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
