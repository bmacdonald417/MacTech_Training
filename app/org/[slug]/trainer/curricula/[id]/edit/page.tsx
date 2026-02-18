import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { CurriculumForm } from "../../curriculum-form"
import type { SectionInput } from "../../actions"

interface EditCurriculumPageProps {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ addContent?: string }>
}

export default async function EditCurriculumPage({ params, searchParams }: EditCurriculumPageProps) {
  const [{ slug, id }, { addContent }] = await Promise.all([params, searchParams])
  const membership = await requireTrainerOrAdmin(slug)

  const [curriculum, contentItems] = await Promise.all([
    prisma.curriculum.findFirst({
      where: { id, orgId: membership.orgId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            items: { orderBy: { order: "asc" } },
          },
        },
      },
    }),
    prisma.contentItem.findMany({
      where: { orgId: membership.orgId },
      select: { id: true, title: true, type: true },
      orderBy: { title: "asc" },
    }),
  ])

  if (!curriculum) {
    notFound()
  }

  let initialSections: SectionInput[] = curriculum.sections.map((sec) => ({
    title: sec.title,
    description: sec.description ?? "",
    contentItemIds: sec.items.map((i) => i.contentItemId),
  }))

  const prefillContentId =
    addContent?.trim() && contentItems.some((c) => c.id === addContent.trim())
      ? addContent.trim()
      : undefined
  if (prefillContentId && initialSections.length > 0) {
    const first = initialSections[0]
    if (!first.contentItemIds.includes(prefillContentId)) {
      initialSections = [
        { ...first, contentItemIds: [...first.contentItemIds, prefillContentId] },
        ...initialSections.slice(1),
      ]
    }
  }

  const contentOptions = contentItems.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
  }))

  return (
    <div className="space-y-10">
      <CurriculumForm
        orgSlug={slug}
        contentItems={contentOptions}
        mode="edit"
        curriculumId={curriculum.id}
        initialTitle={curriculum.title}
        initialDescription={curriculum.description ?? ""}
        initialSections={
          initialSections.length > 0 ? initialSections : [{ title: "", description: "", contentItemIds: [] }]
        }
      />
    </div>
  )
}
