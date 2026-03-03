import { requireAuth } from "@/lib/rbac"
import { PageHeader } from "@/components/ui/page-header"

interface TriptychPageProps {
  params: Promise<{ slug: string }>
}

export default async function TriptychPage({ params }: TriptychPageProps) {
  const { slug } = await params
  await requireAuth(slug)

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="CUI Enclave User Training"
        description="Guided focus presentation — use Play to sync with narration or step with 1, 2, 3, 0 and N/P."
      />
      <div className="min-h-0 flex-1 rounded-md border border-border/40 bg-card/50">
        <iframe
          src="/triptych-player/index.html"
          title="CUI Enclave User Training"
          className="h-full min-h-[480px] w-full rounded-md"
          allow="fullscreen"
        />
      </div>
    </div>
  )
}
