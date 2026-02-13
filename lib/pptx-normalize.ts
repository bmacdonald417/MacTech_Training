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
 * Replace any p:bg that doesn't have a concrete fill with an inline solid fill.
 * pptx-preview can't resolve theme refs (bgRef, schemeClr, etc.) and ends up with undefined .background.
 * Only a:srgbClr (or a:blipFill) is treated as concrete; schemeClr and other refs are replaced.
 */
function replaceBgRefWithSolid(xml: string): string {
  if (!xml.includes("bg>")) return xml
  // Match p:bg with any namespace prefix (e.g. p:bg, px:bg)
  const bgBlockRegex = /<[^:>]*:bg(\s[^>]*)?>[\s\S]*?<\/[^:>]*:bg>/g
  return xml.replace(bgBlockRegex, (match) => {
    if (match.includes("a:srgbClr") || match.includes("a:blipFill")) return match
    return DEFAULT_BG
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

  if (out.includes("<p:bg>") || /<[^:>]*:bg[\s>]/.test(out) || out.includes(":bg>")) return out

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

/** Paths under ppt/ that are XML and may contain cSld (slides, layouts, masters, handout, notes). */
const PPT_XML = /^ppt[\/\\].*\.xml$/i

/**
 * Inject default p:bg into any slide, layout, master, handout, or notes XML that lacks it.
 * Returns a new buffer; does not mutate the input.
 */
export async function ensureSlideBackgrounds(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer)
  let changed = false

  const allNames = Object.keys(zip.files)
  const candidatePaths = allNames.filter((name) => PPT_XML.test(name))

  for (const filePath of candidatePaths) {
    const file = zip.file(filePath)
    if (!file) continue
    const xml = await file.async("string")
    if (xml.indexOf("cSld") === -1) continue
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
