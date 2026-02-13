/**
 * Markdown-to-HTML for resource documents (C3PAO guide, etc.).
 * Handles headings (with ids for TOC), paragraphs, lists (nested), bold, italic, links, images.
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/** Inline markdown: **bold**, *italic*, [text](url), `code`. Run after block structure. */
function processInlines(line: string): string {
  let out = escapeHtml(line)
  // Bold before italic so ** is not broken
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>")
  out = out.replace(/`([^`]+)`/g, "<code class='rounded bg-muted px-1.5 py-0.5 text-sm font-medium'>$1</code>")
  // [text](url) and bare [text]
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    "<a href='$2' class='text-primary underline underline-offset-2 hover:no-underline' target='_blank' rel='noopener noreferrer'>$1</a>"
  )
  out = out.replace(
    /\[([^\]]+)\](?!\()/g,
    "<span class='text-primary font-medium'>$1</span>"
  )
  return out
}

export function markdownToHtml(content: string): string {
  const lines = content.split(/\r?\n/)
  const out: string[] = []
  let i = 0
  let inList = false
  let listDepth = 0 // 0 = top-level ul only, 1 = inside nested ul
  let topLevelLiOpen = false // last top-level <li> left open for possible nested <ul>

  function closeAllLists() {
    if (!inList) return
    if (listDepth > 0) out.push("</ul></li>")
    if (topLevelLiOpen) out.push("</li>")
    out.push("</ul>")
    inList = false
    listDepth = 0
    topLevelLiOpen = false
  }

  function startListItem(isNested: boolean, body: string) {
    const isCodex =
      body.includes("How the Codex Accelerator Helps") ||
      body.includes("How the Codex Helps")
    const liClass = isCodex
      ? "resource-prose__codex-callout"
      : ""

    if (isNested) {
      if (listDepth === 0) {
        out.push("<ul class='resource-prose__nested-list list-disc pl-6 my-2 space-y-1.5'>")
        listDepth = 1
      }
      out.push(`<li class='${liClass}'>${processInlines(body)}</li>`)
    } else {
      if (listDepth === 1) {
        out.push("</ul></li>")
        listDepth = 0
        topLevelLiOpen = false
      }
      if (topLevelLiOpen) out.push("</li>")
      if (!inList) {
        out.push("<ul class='resource-prose__list my-4 space-y-2 list-disc pl-6'>")
        inList = true
      }
      out.push(`<li class='${liClass}'>${processInlines(body)}`)
      topLevelLiOpen = true
    }
  }

  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trimEnd()
    const indent = raw.length - raw.trimStart().length
    const isIndent4 = indent >= 4
    const listMatch = trimmed.match(/^[*\-]\s+(.*)$/)
    const listBody = listMatch ? listMatch[1] : ""

    if (trimmed === "") {
      closeAllLists()
      i++
      continue
    }

    if (trimmed.startsWith("# ")) {
      closeAllLists()
      const title = trimmed.slice(2).trim()
      out.push(`<h1 class='resource-prose__h1 text-3xl font-bold tracking-tight text-foreground mt-2 mb-6'>${processInlines(title)}</h1>`)
      i++
      continue
    }
    if (trimmed.startsWith("## ")) {
      closeAllLists()
      const title = trimmed.slice(3).trim()
      const id = slugify(title)
      out.push(`<h2 id='${id}' class='resource-prose__h2 text-xl font-semibold tracking-tight text-foreground mt-12 mb-4 pb-2 border-b border-border'>${processInlines(title)}</h2>`)
      i++
      continue
    }
    if (trimmed.startsWith("### ")) {
      closeAllLists()
      const title = trimmed.slice(4).trim()
      const id = slugify(title)
      out.push(`<h3 id='${id}' class='resource-prose__h3 text-lg font-semibold text-foreground mt-8 mb-3'>${processInlines(title)}</h3>`)
      i++
      continue
    }

    if (listMatch) {
      startListItem(isIndent4, listBody)
      i++
      continue
    }

    // Image: ![alt](src)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch) {
      closeAllLists()
      const alt = escapeHtml(imgMatch[1])
      const src = imgMatch[2]
      out.push(
        `<figure class='resource-prose__figure my-6'><img src='${escapeHtml(src)}' alt='${alt}' class='max-h-16 object-contain' loading='lazy' /></figure>`
      )
      i++
      continue
    }

    closeAllLists()
    out.push(`<p class='resource-prose__p mb-4 leading-relaxed'>${processInlines(trimmed)}</p>`)
    i++
  }

  closeAllLists()
  return out.join("\n")
}

/**
 * Extract heading entries for table of contents: { id, text, level: 2|3 }.
 */
export function extractToc(html: string): { id: string; text: string; level: 2 | 3 }[] {
  const toc: { id: string; text: string; level: 2 | 3 }[] = []
  const h2Regex = /<h2 id='([^']+)'[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/h2>/gi
  const h3Regex = /<h3 id='([^']+)'[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/h3>/gi
  let m: RegExpExecArray | null
  while ((m = h2Regex.exec(html)) !== null) {
    toc.push({ id: m[1], text: m[2].replace(/<[^>]+>/g, "").trim(), level: 2 })
  }
  while ((m = h3Regex.exec(html)) !== null) {
    toc.push({ id: m[1], text: m[2].replace(/<[^>]+>/g, "").trim(), level: 3 })
  }
  return toc
}
