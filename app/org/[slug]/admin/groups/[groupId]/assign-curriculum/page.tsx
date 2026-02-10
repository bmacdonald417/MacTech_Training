import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { AssignCurriculumForm } from "./assign-curriculum-form"

interface AssignCurriculumPageProps {
  params: Promise<{ slug: string; groupId: string }>
}

export default async function AssignCurriculumPage({ params }: AssignCurriculumPageProps) {
  const { slug, groupId } = await params
  const membership = await requireAdmin(slug)

  const group = await prisma.group.findFirst({
    where: { id: groupId, orgId: membership.orgId },
    select: { id: true, name: true },
  })
  if (!group) notFound()

  const curricula = await prisma.curriculum.findMany({
    where: { orgId: membership.orgId },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  })

  return (
    <AssignCurriculumForm
      orgSlug={slug}
      groupId={group.id}
      groupName={group.name}
      curricula={curricula.map((c) => ({ id: c.id, title: c.title }))}
    />
  )
}
