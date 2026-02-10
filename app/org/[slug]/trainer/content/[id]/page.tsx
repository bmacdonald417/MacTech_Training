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

export default async function ContentViewPage({ params }: ContentViewPageProps) {
  const { slug, id } = await params
  const membership = await requireTrainerOrAdmin(slug)

  const contentItem = await prisma.contentItem.findFirst({
    where: {
      id,
      orgId: membership.orgId,
    },
    include: {
      article: true,
      slideDeck: { include: { slides: { orderBy: { order: "asc" } } } },
      video: true,
      formTemplate: true,
      quiz: { include: { questions: { include: { choices: true }, orderBy: { order: "asc" } } } },
      attestationTemplate: true,
    },
  })

  if (!contentItem) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
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
      <ContentPreview
        contentItem={contentItem}
        orgSlug={slug}
        canGenerateNarration={true}
      />
    </div>
  )
}
