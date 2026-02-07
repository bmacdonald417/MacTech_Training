import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TabNav } from "@/components/ui/tabs"
import Link from "next/link"
import { FileText, Plus, Video, BookOpen, CheckSquare, FileCheck } from "lucide-react"

interface ContentPageProps {
  params: { slug: string }
  searchParams: { tab?: string }
}

const CONTENT_TYPES = [
  "ARTICLE",
  "SLIDE_DECK",
  "VIDEO",
  "FORM",
  "QUIZ",
  "ATTESTATION",
] as const

const contentTypeIcons = {
  ARTICLE: FileText,
  SLIDE_DECK: BookOpen,
  VIDEO: Video,
  QUIZ: CheckSquare,
  ATTESTATION: FileCheck,
  FORM: FileText,
}

const TAB_ITEMS = [
  { value: "all", label: "All" },
  { value: "ARTICLE", label: "Articles" },
  { value: "SLIDE_DECK", label: "Slide decks" },
  { value: "VIDEO", label: "Videos" },
  { value: "FORM", label: "Forms" },
  { value: "QUIZ", label: "Quizzes" },
  { value: "ATTESTATION", label: "Attestations" },
]

function isValidTab(tab: string | undefined): tab is (typeof CONTENT_TYPES)[number] {
  return !!tab && CONTENT_TYPES.includes(tab as (typeof CONTENT_TYPES)[number])
}

export default async function ContentPage({ params, searchParams }: ContentPageProps) {
  const membership = await requireTrainerOrAdmin(params.slug)
  const tab = searchParams.tab === "all" || isValidTab(searchParams.tab)
    ? (searchParams.tab ?? "all")
    : "all"

  const contentItems = await prisma.contentItem.findMany({
    where: {
      orgId: membership.orgId,
      ...(tab !== "all" ? { type: tab } : {}),
    },
    include: {
      article: true,
      slideDeck: true,
      video: true,
      quiz: true,
      attestationTemplate: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const basePath = `/org/${params.slug}/trainer/content`

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Content Library
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage your training content
          </p>
        </div>
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Link>
        </Button>
      </div>

      <TabNav
        tabs={TAB_ITEMS}
        currentValue={tab}
        basePath={basePath}
      />

      {contentItems.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {tab === "all"
                ? "No content items yet."
                : `No ${TAB_ITEMS.find((t) => t.value === tab)?.label?.toLowerCase() ?? tab} yet.`}
            </p>
            <Button asChild>
              <Link href={`${basePath}/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Create content
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contentItems.map((item) => {
            const Icon = contentTypeIcons[item.type] || FileText

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {item.type.replace("_", " ")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`${basePath}/${item.id}`}>
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`${basePath}/${item.id}/edit`}>
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
