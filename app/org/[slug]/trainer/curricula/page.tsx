import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Curricula
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Build structured training paths and add library modules to each section
          </p>
        </div>
        <Button asChild>
          <Link href={`/org/${params.slug}/trainer/curricula/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Curriculum
          </Link>
        </Button>
      </div>

      {curricula.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No curricula yet.</p>
            <Button asChild>
              <Link href={`/org/${params.slug}/trainer/curricula/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Curriculum
              </Link>
            </Button>
          </CardContent>
        </Card>
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
