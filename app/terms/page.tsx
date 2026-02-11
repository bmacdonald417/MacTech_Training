import Link from "next/link"
import { getActiveTermsVersion } from "@/lib/terms"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

// Render at request time so we can reach the DB (build has no DB on Railway)
export const dynamic = "force-dynamic"

function markdownToHtml(content: string): string {
  return content
    .replace(/^### (.*)$/gim, "<h3 class='text-lg font-semibold mt-6 mb-2'>$1</h3>")
    .replace(/^## (.*)$/gim, "<h2 class='text-xl font-semibold mt-8 mb-2'>$1</h2>")
    .replace(/^# (.*)$/gim, "<h1 class='text-2xl font-bold mt-4 mb-4'>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\n\n/gim, "</p><p class='mb-4'>")
    .replace(/\n/gim, "<br />")
}

export default async function TermsPage() {
  const terms = await getActiveTermsVersion()
  if (!terms) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-muted-foreground">Terms of Service are not yet available.</p>
          <Button asChild variant="link" className="mt-4">
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const html = markdownToHtml(terms.content)

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">{terms.title}</h1>
          <p className="text-sm text-muted-foreground">
            Version: {terms.version} · Last updated: {format(terms.createdAt, "MMMM d, yyyy")}
          </p>
        </div>
        <article
          className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="mt-12 pt-8 border-t border-border">
          <Button asChild variant="outline">
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
