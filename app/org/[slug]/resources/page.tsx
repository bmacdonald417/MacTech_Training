import Link from "next/link"
import { requireAuth } from "@/lib/rbac"
import { RESOURCES } from "@/lib/resources"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface ResourcesPageProps {
  params: Promise<{ slug: string }>
}

export default async function ResourcesPage({ params }: ResourcesPageProps) {
  const { slug } = await params
  await requireAuth(slug)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resources"
        description="Reference guides and materials available to all users"
      />
      <div className="grid gap-4 sm:grid-cols-1">
        {RESOURCES.map((resource) => (
          <Card key={resource.id} variant="interactive" className="transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">{resource.title}</CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/org/${slug}/resources/${resource.id}`}>
                  Open
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
