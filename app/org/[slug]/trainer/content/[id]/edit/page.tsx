import Link from "next/link"
import { notFound } from "next/navigation"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { ContentEditForm } from "./content-edit-form"
import { ArrowLeft } from "lucide-react"

interface ContentEditPageProps {
  params: { slug: string; id: string }
}

export default async function ContentEditPage({ params }: ContentEditPageProps) {
  const membership = await requireTrainerOrAdmin(params.slug)

  const contentItem = await prisma.contentItem.findFirst({
    where: {
      id: params.id,
      orgId: membership.orgId,
    },
    include: {
      article: true,
      slideDeck: { include: { slides: { orderBy: { order: "asc" } } } },
      video: true,
      formTemplate: true,
      quiz: true,
      attestationTemplate: true,
    },
  })

  if (!contentItem) {
    notFound()
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/org/${params.slug}/trainer/content/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Edit content"
        description={contentItem.title}
      />
      <ContentEditForm orgSlug={params.slug} contentItem={contentItem} />
    </div>
  )
}
