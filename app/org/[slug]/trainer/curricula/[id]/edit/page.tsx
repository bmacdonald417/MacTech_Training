import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { CurriculumForm } from "../../curriculum-form"
import type { SectionInput } from "../../actions"

interface EditCurriculumPageProps {
  params: { slug: string; id: string }
}

export default async function EditCurriculumPage({ params }: EditCurriculumPageProps) {
  const membership = await requireTrainerOrAdmin(params.slug)

  const [curriculum, contentItems] = await Promise.all([
    prisma.curriculum.findFirst({
      where: { id: params.id, orgId: membership.orgId },
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

  const initialSections: SectionInput[] = curriculum.sections.map((sec) => ({
    title: sec.title,
    description: sec.description ?? "",
    contentItemIds: sec.items.map((i) => i.contentItemId),
  }))

  const contentOptions = contentItems.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
  }))

  return (
    <div className="space-y-10">
      <CurriculumForm
        orgSlug={params.slug}
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
