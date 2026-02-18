import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { CurriculumForm } from "../curriculum-form"

interface NewCurriculumPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ addContent?: string }>
}

export default async function NewCurriculumPage({ params, searchParams }: NewCurriculumPageProps) {
  const [{ slug }, { addContent }] = await Promise.all([params, searchParams])
  const membership = await requireTrainerOrAdmin(slug)

  const contentItems = await prisma.contentItem.findMany({
    where: { orgId: membership.orgId },
    select: { id: true, title: true, type: true },
    orderBy: { title: "asc" },
  })

  const contentOptions = contentItems.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
  }))

  const prefillContentId =
    addContent?.trim() && contentOptions.some((c) => c.id === addContent.trim())
      ? addContent.trim()
      : undefined

  const initialSections =
    prefillContentId !== undefined
      ? [{ title: "", description: "", contentItemIds: [prefillContentId] }]
      : [{ title: "", description: "", contentItemIds: [] }]

  return (
    <div className="space-y-10">
      <CurriculumForm
        orgSlug={slug}
        contentItems={contentOptions}
        mode="create"
        initialTitle=""
        initialDescription=""
        initialSections={initialSections}
      />
    </div>
  )
}
