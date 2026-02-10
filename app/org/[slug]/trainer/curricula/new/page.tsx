import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { CurriculumForm } from "../curriculum-form"

interface NewCurriculumPageProps {
  params: Promise<{ slug: string }>
}

export default async function NewCurriculumPage({ params }: NewCurriculumPageProps) {
  const { slug } = await params
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

  return (
    <div className="space-y-10">
      <CurriculumForm
        orgSlug={slug}
        contentItems={contentOptions}
        mode="create"
        initialTitle=""
        initialDescription=""
        initialSections={[{ title: "", description: "", contentItemIds: [] }]}
      />
    </div>
  )
}
