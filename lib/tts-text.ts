/**
 * Extract plain text for TTS from slide or article content.
 * Removes excessive punctuation and repeated whitespace; keeps professional tone.
 */

/**
 * Strip markdown-like formatting to plain text for speech.
 */
function toPlainText(raw: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[.!?]+/g, (m) => m[0]) // collapse repeated sentence endings to one
    .trim()
}

/**
 * Format for slide narration. Prefers speaker notes when present; otherwise uses title + slide content.
 */
export function getSlideNarrationText(
  slideIndex: number,
  title: string,
  content: string,
  speakerNotes?: string | null
): string {
  const notes = speakerNotes?.trim()
  if (notes) {
    return toPlainText(notes)
  }
  const slideNum = slideIndex + 1
  const body = toPlainText(content)
  const prefix = `Slide ${slideNum}: ${title.trim()}.`
  if (!body) return prefix
  return `${prefix} ${body}`
}

/**
 * Format for article narration: "{title}. {body...}"
 */
export function getArticleNarrationText(title: string, bodyContent: string): string {
  const body = toPlainText(bodyContent)
  const titleClean = title.trim()
  if (!body) return titleClean
  return `${titleClean}. ${body}`
}
