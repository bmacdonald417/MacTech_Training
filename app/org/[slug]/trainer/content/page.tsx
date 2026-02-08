import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
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
      <PageHeader
        title="Content"
        description="Manage your training content"
        action={
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus className="h-4 w-4" />
              Create Content
            </Link>
          </Button>
        }
      />

      <TabNav
        tabs={TAB_ITEMS}
        currentValue={tab}
        basePath={basePath}
      />

      {contentItems.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={tab === "all" ? "No content yet" : `No ${TAB_ITEMS.find((t) => t.value === tab)?.label?.toLowerCase() ?? tab} yet`}
          description="Create your first content item to get started."
          action={
            <Button asChild>
              <Link href={`${basePath}/new`}>
                <Plus className="h-4 w-4" />
                Create content
              </Link>
            </Button>
          }
        />
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
