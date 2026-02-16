import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Presentation } from "lucide-react"

export const dynamic = "force-dynamic"

/**
 * Slide deck file view: link to in-browser show or download.
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; fileId: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { slug, fileId } = await params
  const { from } = await searchParams
  await requireAuth(slug)

  const slideDeck = await prisma.slideDeck.findFirst({
    where: { sourceFileId: fileId },
    select: {
      contentItem: { select: { title: true } },
      sourceFile: { select: { filename: true } },
    },
  })

  const title = slideDeck?.contentItem?.title ?? slideDeck?.sourceFile?.filename ?? "Presentation"
  const downloadUrl = `/api/org/${slug}/slides/file/${fileId}`
  const showUrl = `/org/${slug}/slides/show/${fileId}`
  const backHref = from && from.startsWith("/") && !from.startsWith("//") ? from : `/org/${slug}/my-training`

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-slate-400 text-sm">
          View slides in your browser or download to open in PowerPoint or Keynote.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild className="gap-2">
            <Link href={showUrl}>
              <Presentation className="h-4 w-4" />
              View in browser
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2 border-white/30 text-white hover:bg-white/10">
            <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              Download presentation
            </a>
          </Button>
          <Button variant="ghost" asChild className="gap-2 text-white/70 hover:text-white">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
