import { requireTrainerOrAdmin } from "@/lib/rbac"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface NewDocumentPageProps {
  params: Promise<{ slug: string }>
}

export default async function NewDocumentPage({ params }: NewDocumentPageProps) {
  const { slug } = await params
  await requireTrainerOrAdmin(slug)
  const basePath = `/org/${slug}/trainer/documents`

  return (
    <div className="space-y-10">
      <PageHeader
        title="New controlled document"
        description="Create a new QMS document (DRAFT)"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={basePath}>
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Use the API to create documents, or implement a create form here. New documents start as
          DRAFT and require approval workflow to become EFFECTIVE.
        </CardContent>
      </Card>
    </div>
  )
}
