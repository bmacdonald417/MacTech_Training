import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { NewAssignmentForm } from "../new-assignment-form"

interface NewAssignmentPageProps {
  params: Promise<{ slug: string }>
}

export default async function NewAssignmentPage({ params }: NewAssignmentPageProps) {
  const { slug } = await params
  const membership = await requireTrainerOrAdmin(slug)

  const [curricula, contentItems] = await Promise.all([
    prisma.curriculum.findMany({
      where: { orgId: membership.orgId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.contentItem.findMany({
      where: { orgId: membership.orgId },
      select: { id: true, title: true, type: true },
      orderBy: { title: "asc" },
    }),
  ])

  return (
    <div className="space-y-10">
      <NewAssignmentForm
        orgSlug={slug}
        curricula={curricula}
        contentItems={contentItems.map((c) => ({ id: c.id, title: c.title, type: c.type }))}
      />
    </div>
  )
}
