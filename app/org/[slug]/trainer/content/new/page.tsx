import Link from "next/link"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { ContentNewForm } from "./content-new-form"
import { ArrowLeft } from "lucide-react"

const CONTENT_TYPES = [
  { value: "ARTICLE", label: "Article" },
  { value: "SLIDE_DECK", label: "Slide deck" },
  { value: "VIDEO", label: "Video" },
  { value: "FORM", label: "Form" },
  { value: "QUIZ", label: "Quiz" },
  { value: "ATTESTATION", label: "Attestation" },
] as const

type ContentTypeValue = (typeof CONTENT_TYPES)[number]["value"]

interface NewContentPageProps {
  params: { slug: string }
  searchParams: { type?: string }
}

export default async function NewContentPage({ params, searchParams }: NewContentPageProps) {
  await requireTrainerOrAdmin(params.slug)

  const typeParam = searchParams.type?.toUpperCase()
  const initialType: ContentTypeValue =
    CONTENT_TYPES.some((t) => t.value === typeParam) ? (typeParam as ContentTypeValue) : "VIDEO"

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/org/${params.slug}/trainer/content`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Create content"
        description="Add a new item to your content library"
      />
      <ContentNewForm orgSlug={params.slug} initialType={initialType} />
    </div>
  )
}
