import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  GraduationCap,
  ArrowLeft,
  FileText,
  Video,
  BookOpen,
  CheckSquare,
  FileCheck,
  Layers,
} from "lucide-react"

interface CurriculumViewPageProps {
  params: Promise<{ slug: string; id: string }>
}

const contentTypeIcons = {
  ARTICLE: FileText,
  SLIDE_DECK: BookOpen,
  VIDEO: Video,
  QUIZ: CheckSquare,
  ATTESTATION: FileCheck,
  FORM: FileText,
}

export default async function CurriculumViewPage({
  params,
}: CurriculumViewPageProps) {
  const { slug, id } = await params
  const membership = await requireTrainerOrAdmin(slug)

  const curriculum = await prisma.curriculum.findFirst({
    where: {
      id,
      orgId: membership.orgId,
    },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              contentItem: true,
            },
          },
        },
      },
    },
  })

  if (!curriculum) {
    notFound()
  }

  const basePath = `/org/${slug}/trainer`

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-5">
        <Button variant="ghost" size="icon" asChild className="-ml-1">
          <Link href={`${basePath}/curricula`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {curriculum.title}
          </h1>
          {curriculum.description && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {curriculum.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`${basePath}/curricula/${curriculum.id}/edit`}>
            Edit curriculum
          </Link>
        </Button>
      </div>

      {curriculum.sections.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No sections or modules yet. Edit this curriculum to add content.
            </p>
            <Button variant="outline" asChild>
              <Link href={`${basePath}/curricula/${curriculum.id}/edit`}>
                Edit curriculum
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {curriculum.sections.map((section, sectionIndex) => {
            const ContentIcon = Layers
            return (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      Section {sectionIndex + 1}: {section.title}
                    </CardTitle>
                  </div>
                  {section.description && (
                    <CardDescription>{section.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => {
                      const Icon =
                        contentTypeIcons[item.contentItem.type as keyof typeof contentTypeIcons] ??
                        ContentIcon
                      return (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/60 hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">
                              {itemIndex + 1}.
                            </span>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {item.contentItem.title}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {item.contentItem.type.replace("_", " ")}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`${basePath}/content`}>
                              Open in library
                            </Link>
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
