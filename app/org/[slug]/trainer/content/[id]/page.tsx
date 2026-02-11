import Link from "next/link"
import { notFound } from "next/navigation"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { ContentPreview } from "./content-preview"
import { ArrowLeft } from "lucide-react"

interface ContentViewPageProps {
  params: Promise<{ slug: string; id: string }>
}

const contentItemInclude = {
  article: true,
  video: true,
  formTemplate: true,
  quiz: { include: { questions: { include: { choices: true }, orderBy: { order: "asc" } } } },
  attestationTemplate: true,
} as const

type ContentItemForView = NonNullable<Awaited<ReturnType<typeof prisma.contentItem.findFirst<{
  where: { id: string; orgId: string }
  include: typeof contentItemInclude & { slideDeck: { include: { sourceFile: true; slides: { orderBy: { order: "asc" } } } } }
}>>>>

export default async function ContentViewPage({ params }: ContentViewPageProps) {
  const { slug, id } = await params
  const membership = await requireTrainerOrAdmin(slug)

  let contentItem: ContentItemForView | null = await prisma.contentItem.findFirst({
    where: { id, orgId: membership.orgId },
    include: {
      ...contentItemInclude,
      slideDeck: { include: { sourceFile: true, slides: { orderBy: { order: "asc" } } } },
    },
  }).catch(() => null)

  if (!contentItem) {
    const fallback = await prisma.contentItem.findFirst({
      where: { id, orgId: membership.orgId },
      include: {
        ...contentItemInclude,
        slideDeck: { select: { id: true, contentItemId: true, createdAt: true, updatedAt: true, slides: { orderBy: { order: "asc" } } } },
      },
    })
    contentItem = fallback as ContentItemForView
  }

  if (!contentItem) {
    notFound()
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] min-h-[600px] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/org/${slug}/trainer/content`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <PageHeader
        title={contentItem.title}
        description={contentItem.description ?? undefined}
        action={
          <Button variant="outline" asChild>
            <Link href={`/org/${slug}/trainer/content/${id}/edit`}>
              Edit
            </Link>
          </Button>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ContentPreview
          contentItem={contentItem}
          orgSlug={slug}
          canGenerateNarration={true}
        />
      </div>
    </div>
  )
}
