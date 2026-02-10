import { requireTrainerOrAdmin } from "@/lib/rbac"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"

interface CompetencyPageProps {
  params: Promise<{ slug: string }>
}

export default async function CompetencyPage({ params }: CompetencyPageProps) {
  const { slug } = await params
  await requireTrainerOrAdmin(slug)

  return (
    <div className="space-y-10">
      <PageHeader
        title="Internal Training & Competency"
        description="Staff training records and document acknowledgments"
      />
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Competency records and document acknowledgments will be listed here. This area supports
          ISO 17025 personnel competence and training requirements.
        </CardContent>
      </Card>
    </div>
  )
}
