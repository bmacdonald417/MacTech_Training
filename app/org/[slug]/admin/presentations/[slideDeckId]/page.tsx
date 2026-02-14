import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { PresentationAdminEditor } from "./presentation-admin-editor"
import { getSlideNarrationText } from "@/lib/tts-text"

interface PageProps {
  params: Promise<{ slug: string; slideDeckId: string }>
}

export default async function PresentationAdminDetailPage({ params }: PageProps) {
  const { slug, slideDeckId } = await params
  const membership = await requireAdmin(slug)

  const deck = await prisma.slideDeck.findFirst({
    where: {
      id: slideDeckId,
      contentItem: { orgId: membership.orgId },
    },
    select: {
      id: true,
      contentItem: { select: { title: true } },
      sourceFile: { select: { id: true, filename: true } },
      slides: {
        orderBy: { order: "asc" },
        select: { id: true, order: true, title: true, content: true, notesRichText: true },
      },
    },
  })

  if (!deck) notFound()

  const slideIds = deck.slides.map((s) => s.id)
  const narrationAssets = slideIds.length
    ? await prisma.narrationAsset.findMany({
        where: {
          orgId: membership.orgId,
          entityType: "SLIDE",
          entityId: { in: slideIds },
        },
        select: { entityId: true, updatedAt: true, voice: true, inputText: true },
      })
    : []

  const narrationBySlideId = new Map(
    narrationAssets.map((a) => [
      a.entityId,
      {
        updatedAt: a.updatedAt.toISOString(),
        voice: a.voice,
        inputText: a.inputText,
      },
    ])
  )

  return (
    <div className="space-y-10">
      <PageHeader
        title="Presentation settings"
        description={deck.contentItem?.title ?? deck.sourceFile?.filename ?? deck.id}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/org/${slug}/admin/presentations`}>Back</Link>
            </Button>
            {deck.sourceFile?.id && (
              <Button asChild className="gap-2">
                <Link
                  href={`/org/${slug}/slides/view/${deck.sourceFile.id}?images=1&from=${encodeURIComponent(
                    `/org/${slug}/admin/presentations/${deck.id}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open viewer
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <PresentationAdminEditor
        orgSlug={slug}
        slideDeckId={deck.id}
        title={deck.contentItem?.title ?? "Presentation"}
        sourceFileId={deck.sourceFile?.id ?? null}
        slides={deck.slides.map((s, idx) => ({
          id: s.id,
          order: s.order,
          title: s.title,
          notesRichText: s.notesRichText,
          // Default script used for TTS when no saved inputText exists.
          defaultScript: getSlideNarrationText(idx, s.title, s.content, s.notesRichText),
          narration: narrationBySlideId.get(s.id) ?? null,
        }))}
      />
    </div>
  )
}

