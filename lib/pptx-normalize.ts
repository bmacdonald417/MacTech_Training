/**
 * Normalize a PPTX buffer so the pptx-preview library can render it.
 * Injects a default slide background where missing (avoids "Cannot read properties of undefined (reading 'background')").
 */

import JSZip from "jszip"

const DEFAULT_BG =
  '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></p:bgPr></p:bg>'

/**
 * If the PPTX has slides that lack a p:bg (background) element, inject a default white background.
 * Returns a new buffer; does not mutate the input.
 */
export async function ensureSlideBackgrounds(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer)
  const slidePaths = Object.keys(zip.files).filter(
    (name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name)
  )
  if (slidePaths.length === 0) return buffer

  let changed = false
  for (const path of slidePaths) {
    const file = zip.file(path)
    if (!file) continue
    let xml = await file.async("string")
    if (xml.includes("<p:bg>")) continue
    if (!xml.includes("cSld")) continue
    xml = xml.replace(/<p:cSld([^>]*)>/, "<p:cSld$1>" + DEFAULT_BG)
    zip.file(path, xml)
    changed = true
  }

  if (!changed) return buffer
  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })
  return Buffer.from(out)
}
