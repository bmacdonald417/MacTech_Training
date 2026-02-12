import { PptxPresentationViewer } from "@/components/training/pptx-presentation-viewer"

export const dynamic = "force-dynamic"

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; fileId: string }>
}) {
  const { slug, fileId } = await params
  return <PptxPresentationViewer orgSlug={slug} sourceFileId={fileId} />
}

