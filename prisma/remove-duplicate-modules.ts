/**
 * Remove duplicate modules from the database.
 * Duplicates are identified by:
 * - ContentItem: same orgId + type + title (keep oldest by createdAt)
 * - Curriculum: same orgId + title (keep oldest by createdAt)
 * - CertificateTemplate: same orgId + name (keep oldest by createdAt)
 *
 * Run: npx tsx prisma/remove-duplicate-modules.ts
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type ContentItemRow = { id: string; orgId: string; type: string; title: string; createdAt: Date }
type CurriculumRow = { id: string; orgId: string; title: string; createdAt: Date }
type CertificateTemplateRow = { id: string; orgId: string; name: string; curriculumId: string | null; createdAt: Date }

async function main() {
  console.log("Scanning for duplicate modules...\n")

  // --- 1. Duplicate ContentItems (orgId + type + title) ---
  const contentItems = await prisma.contentItem.findMany({
    select: { id: true, orgId: true, type: true, title: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const contentKey = (c: ContentItemRow) => `${c.orgId}|${c.type}|${c.title}`
  const contentGroups = new Map<string, ContentItemRow[]>()
  for (const c of contentItems) {
    const key = contentKey(c)
    if (!contentGroups.has(key)) contentGroups.set(key, [])
    contentGroups.get(key)!.push(c)
  }

  const contentDuplicates = [...contentGroups.values()].filter((g) => g.length > 1)
  let contentRemoved = 0

  for (const group of contentDuplicates) {
    const [keep, ...duplicates] = group
    console.log(`ContentItem duplicates for "${keep.title}" (${keep.type}): keeping ${keep.id}, removing ${duplicates.length}`)
    for (const dup of duplicates) {
      await prisma.$transaction(async (tx) => {
        await tx.curriculumItem.updateMany({ where: { contentItemId: dup.id }, data: { contentItemId: keep.id } })
        await tx.assignment.updateMany({ where: { contentItemId: dup.id }, data: { contentItemId: keep.id } })
        await tx.enrollmentItemProgress.deleteMany({ where: { contentItemId: dup.id } })
        await tx.contentItem.delete({ where: { id: dup.id } })
      })
      contentRemoved++
    }
  }

  if (contentRemoved > 0) {
    console.log(`Removed ${contentRemoved} duplicate ContentItem(s).\n`)
  } else if (contentDuplicates.length === 0) {
    console.log("No duplicate ContentItems found.\n")
  }

  // --- 2. Duplicate Curricula (orgId + title) ---
  const curricula = await prisma.curriculum.findMany({
    select: { id: true, orgId: true, title: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const curriculumKey = (c: CurriculumRow) => `${c.orgId}|${c.title}`
  const curriculumGroups = new Map<string, CurriculumRow[]>()
  for (const c of curricula) {
    const key = curriculumKey(c)
    if (!curriculumGroups.has(key)) curriculumGroups.set(key, [])
    curriculumGroups.get(key)!.push(c)
  }

  const curriculumDuplicates = [...curriculumGroups.values()].filter((g) => g.length > 1)
  let curriculumRemoved = 0

  for (const group of curriculumDuplicates) {
    const [keep, ...duplicates] = group
    console.log(`Curriculum duplicates for "${keep.title}": keeping ${keep.id}, removing ${duplicates.length}`)
    for (const dup of duplicates) {
      await prisma.$transaction(async (tx) => {
        await tx.certificateTemplate.updateMany({ where: { curriculumId: dup.id }, data: { curriculumId: keep.id } })
        await tx.assignment.updateMany({ where: { curriculumId: dup.id }, data: { curriculumId: keep.id } })
        await tx.curriculum.delete({ where: { id: dup.id } })
      })
      curriculumRemoved++
    }
  }

  if (curriculumRemoved > 0) {
    console.log(`Removed ${curriculumRemoved} duplicate Curriculum(ies).\n`)
  } else if (curriculumDuplicates.length === 0) {
    console.log("No duplicate Curricula found.\n")
  }

  // --- 3. Duplicate CertificateTemplates (orgId + name) ---
  const certTemplates = await prisma.certificateTemplate.findMany({
    select: { id: true, orgId: true, name: true, curriculumId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const certKey = (c: CertificateTemplateRow) => `${c.orgId}|${c.name}`
  const certGroups = new Map<string, CertificateTemplateRow[]>()
  for (const c of certTemplates) {
    const key = certKey(c)
    if (!certGroups.has(key)) certGroups.set(key, [])
    certGroups.get(key)!.push(c)
  }

  const certDuplicates = [...certGroups.values()].filter((g) => g.length > 1)
  let certRemoved = 0

  for (const group of certDuplicates) {
    const [keep, ...duplicates] = group
    console.log(`CertificateTemplate duplicates for "${keep.name}": keeping ${keep.id}, removing ${duplicates.length}`)
    for (const dup of duplicates) {
      await prisma.$transaction(async (tx) => {
        await tx.certificateIssued.updateMany({ where: { templateId: dup.id }, data: { templateId: keep.id } })
        await tx.certificateTemplate.delete({ where: { id: dup.id } })
      })
      certRemoved++
    }
  }

  if (certRemoved > 0) {
    console.log(`Removed ${certRemoved} duplicate CertificateTemplate(s).\n`)
  } else if (certDuplicates.length === 0) {
    console.log("No duplicate CertificateTemplates found.\n")
  }

  console.log("Done.")
  console.log(`Summary: ${contentRemoved} content, ${curriculumRemoved} curricula, ${certRemoved} certificate templates removed.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
