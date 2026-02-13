import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/rbac"
import { getResourceById, getResourceContent } from "@/lib/resources"
import { markdownToHtml } from "@/lib/markdown"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface ResourcePageProps {
  params: Promise<{ slug: string; resourceId: string }>
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug, resourceId } = await params
  await requireAuth(slug)

  const resource = getResourceById(resourceId)
  if (!resource) notFound()

  const rawContent = await getResourceContent(resourceId)
  if (rawContent == null) notFound()

  const html = markdownToHtml(rawContent)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title={resource.title} description={resource.description} />
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={`/org/${slug}/resources`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </Link>
        </Button>
      </div>
      <article
        className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed rounded-lg border border-border bg-card p-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
