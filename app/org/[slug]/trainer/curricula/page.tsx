import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GraduationCap, Plus } from "lucide-react"

interface CurriculaPageProps {
  params: { slug: string }
}

export default async function CurriculaPage({ params }: CurriculaPageProps) {
  const membership = await requireTrainerOrAdmin(params.slug)

  const curricula = await prisma.curriculum.findMany({
    where: { orgId: membership.orgId },
    include: {
      sections: {
        include: {
          items: {
            include: {
              contentItem: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-10">
      <PageHeader
        title="Curricula"
        description="Build structured training paths and add library modules to each section"
        action={
          <Button asChild>
            <Link href={`/org/${params.slug}/trainer/curricula/new`}>
              <Plus className="h-4 w-4" />
              Create Curriculum
            </Link>
          </Button>
        }
      />

      {curricula.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No curricula yet"
          description="Create a curriculum to group content into sections and learning paths."
          action={
            <Button asChild>
              <Link href={`/org/${params.slug}/trainer/curricula/new`}>
                <Plus className="h-4 w-4" />
                Create curriculum
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {curricula.map((curriculum) => {
            const totalItems = curriculum.sections.reduce(
              (acc, section) => acc + section.items.length,
              0
            )

            return (
              <Card key={curriculum.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{curriculum.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {curriculum.sections.length} sections • {totalItems} items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {curriculum.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {curriculum.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/org/${params.slug}/trainer/curricula/${curriculum.id}`}>
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/org/${params.slug}/trainer/curricula/${curriculum.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
