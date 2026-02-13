import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/rbac"
import { getResourceById, getResourceContent } from "@/lib/resources"
import { markdownToHtml, extractToc } from "@/lib/markdown"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen } from "lucide-react"

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
  const toc = extractToc(html)

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      {/* Hero + back */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
            <Link href={`/org/${slug}/resources`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Resources
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Reference
            </span>
            <span className="text-xs text-muted-foreground">MacTech</span>
          </div>
          <PageHeader
            title={resource.title}
            description={resource.description}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(12rem,16rem)]">
        {/* Main article — optimal reading width */}
        <article
          className="resource-prose min-w-0 max-w-[65ch]"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Sticky TOC */}
        {toc.length > 0 && (
          <aside
            aria-label="On this page"
            className="hidden lg:block lg:sticky lg:top-6 lg:self-start"
          >
            <nav className="rounded-lg border border-border bg-card/60 p-4 backdrop-blur-sm">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                On this page
              </p>
              <ul className="space-y-1.5 text-sm">
                {toc.map((item) => (
                  <li
                    key={item.id}
                    className={item.level === 3 ? "pl-3" : ""}
                  >
                    <a
                      href={`#${item.id}`}
                      className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>
    </div>
  )
}
