import Link from "next/link"
import { notFound } from "next/navigation"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { ContentEditForm } from "./content-edit-form"
import { ArrowLeft } from "lucide-react"

interface ContentEditPageProps {
  params: Promise<{ slug: string; id: string }>
}

const contentItemIncludeEdit = {
  article: true,
  video: true,
  formTemplate: true,
  quiz: {
    include: {
      questions: {
        include: { choices: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  },
  attestationTemplate: true,
} as const

type ContentItemForEdit = NonNullable<Awaited<ReturnType<typeof prisma.contentItem.findFirst<{
  where: { id: string; orgId: string }
  include: typeof contentItemIncludeEdit & { slideDeck: { include: { sourceFile: true; slides: { orderBy: { order: "asc" } } } } }
}>>>>

export default async function ContentEditPage({ params }: ContentEditPageProps) {
  const { slug, id } = await params
  const membership = await requireTrainerOrAdmin(slug)

  let contentItem: ContentItemForEdit | null = await prisma.contentItem.findFirst({
    where: { id, orgId: membership.orgId },
    include: {
      ...contentItemIncludeEdit,
      slideDeck: { include: { sourceFile: true, slides: { orderBy: { order: "asc" } } } },
    },
  }).catch(() => null)

  if (!contentItem) {
    const fallback = await prisma.contentItem.findFirst({
      where: { id, orgId: membership.orgId },
      include: {
        ...contentItemIncludeEdit,
        slideDeck: { select: { id: true, contentItemId: true, createdAt: true, updatedAt: true, slides: { orderBy: { order: "asc" } } } },
      },
    })
    contentItem = fallback as ContentItemForEdit
  }

  if (!contentItem) {
    notFound()
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/org/${slug}/trainer/content/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Edit content"
        description={contentItem.title}
      />
      <ContentEditForm orgSlug={slug} contentItem={contentItem} />
    </div>
  )
}
