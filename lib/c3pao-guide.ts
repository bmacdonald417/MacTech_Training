/**
 * Parses the C3PAO Interrogation Guide markdown into structured sections and tables.
 */

export interface DocRow {
  document: string
  description: string
}

export interface PracticeRow {
  id: string
  title: string
  interview: string
  examine: string
  test: string
  codex: string
}

export interface DomainSection {
  id: string
  title: string
  shortLabel: string
  practices: PracticeRow[]
}

export interface C3PAOParsed {
  overviewIntro: string
  generalDocsTable: DocRow[]
  domains: DomainSection[]
  conclusion: string
}

function extractBullet(text: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(
    `\\*\\s+\\*\\*${escaped}\\*\\*:\\s*([\\s\\S]*?)(?=\\n\\s*\\*\\s+\\*\\*|\\n\\s{4}\\*\\s+\\*\\*|\\n### |\\n## |$)`,
    "im"
  )
  const m = text.match(re)
  return m ? m[1].replace(/\s+/g, " ").trim() : ""
}

function parseGeneralDocsSection(content: string): DocRow[] {
  const rows: DocRow[] = []
  const listBlock = content.replace(/^[^\n]*\n\nBefore diving[\s\S]*?configuration:\s*\n\n/im, "")
  const itemRe = /^\s*-\s+\*\*(.+?)\*\*:\s*([\s\S]+?)(?=\n\s*-\s+\*\*|\n## |$)/gm
  let m
  while ((m = itemRe.exec(listBlock)) !== null) {
    const desc = m[2].replace(/\s+/g, " ").trim()
    rows.push({ document: m[1].trim(), description: desc })
  }
  return rows
}

function parsePracticeBlock(block: string): PracticeRow | null {
  const heading = block.match(/^###\s+(.+?):\s*(.+?)(?=\n|$)/m)
  if (!heading) return null
  const id = heading[1].trim()
  const title = heading[2].trim()
  const interview = extractBullet(block, "Interview")
  const examine = extractBullet(block, "Examine")
  const test = extractBullet(block, "Test")
  const codex =
    extractBullet(block, "How the Codex Accelerator Helps") || extractBullet(block, "Codex")
  return { id, title, interview, examine, test, codex }
}

function parseDomainSection(content: string): DomainSection | null {
  const heading = content.match(/^Domain\s+(\d+):\s*(.+?)(?=\n|$)/m)
  if (!heading) return null
  const domainNum = heading[1]
  const fullTitle = heading[2].trim()
  const shortMatch = fullTitle.match(/\((\w+)\)\s*$/)
  const shortLabel = shortMatch ? shortMatch[1] : `D${domainNum}`
  const practices: PracticeRow[] = []
  const practiceBlocks = content.split(/\n### /).slice(1)
  for (const block of practiceBlocks) {
    const row = parsePracticeBlock("\n### " + block)
    if (row) practices.push(row)
  }
  return {
    id: `domain-${domainNum}`,
    title: `Domain ${domainNum}: ${fullTitle}`,
    shortLabel,
    practices,
  }
}

export function parseC3PAOMarkdown(raw: string): C3PAOParsed {
  const sections = raw.split(/\n## /).filter(Boolean)
  let overviewIntro = ""
  let generalDocsTable: DocRow[] = []
  const domains: DomainSection[] = []
  let conclusion = ""

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    const firstLine = section.split("\n")[0]?.trim() ?? ""

    if (i === 0 && (section.startsWith("The C3PAO") || firstLine.startsWith("The C3PAO"))) {
      overviewIntro = section.split("## General Documentation")[0].trim()
      overviewIntro = overviewIntro
        .replace(/^#\s+The C3PAO[\s\S]*?\!\[[^\]]*\]\([^)]*\)\s*\n*/i, "")
        .trim()
      continue
    }
    if (firstLine.startsWith("General Documentation")) {
      generalDocsTable = parseGeneralDocsSection("## " + section)
      continue
    }
    if (firstLine.startsWith("Domain ")) {
      const domain = parseDomainSection(section)
      if (domain) domains.push(domain)
      continue
    }
    if (firstLine.startsWith("Conclusion")) {
      conclusion = section.replace(/^Conclusion[^\n]*\n?/i, "").trim()
    }
  }

  return {
    overviewIntro,
    generalDocsTable,
    domains,
    conclusion,
  }
}
