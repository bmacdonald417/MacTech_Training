import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { NewUserForm } from "./new-user-form"

interface NewUserPageProps {
  params: Promise<{ slug: string }>
}

export default async function NewUserPage({ params }: NewUserPageProps) {
  const { slug } = await params
  await requireAdmin(slug)
  const groups = await prisma.group.findMany({
    where: { org: { slug } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
  return <NewUserForm slug={slug} groups={groups.map((g) => ({ id: g.id, name: g.name }))} />
}
