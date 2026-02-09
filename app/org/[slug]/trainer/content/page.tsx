import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { TabNav } from "@/components/ui/tabs"
import Link from "next/link"
import {
  FileText,
  Plus,
  Video,
  BookOpen,
  CheckSquare,
  FileCheck,
  ShieldCheck,
  Globe,
  FolderLock,
  ClipboardList,
} from "lucide-react"

interface ContentPageProps {
  params: { slug: string }
  searchParams: { category?: string; tab?: string }
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

/** Main content categories: Internal first, then Public */
const MAIN_CATEGORIES = [
  { value: "internal", label: "Internal", icon: FolderLock },
  { value: "public", label: "Public", icon: Globe },
] as const

/** Sub-categories under Internal */
const INTERNAL_SUB_CATEGORIES = [
  {
    value: "qms",
    label: "Internal QMS",
    description: "Controlled documents, policies, SOPs, and forms",
    href: (slug: string) => `/org/${slug}/trainer/documents`,
    icon: ShieldCheck,
  },
  {
    value: "competency",
    label: "Internal Training & Competency",
    description: "Staff training records and document acknowledgments",
    href: (slug: string) => `/org/${slug}/trainer/competency`,
    icon: ClipboardList,
  },
] as const

const PUBLIC_TAB_ITEMS = [
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

function isValidCategory(
  category: string | undefined
): category is (typeof MAIN_CATEGORIES)[number]["value"] {
  return !!category && MAIN_CATEGORIES.some((c) => c.value === category)
}

export default async function ContentPage({ params, searchParams }: ContentPageProps) {
  const membership = await requireTrainerOrAdmin(params.slug)
  const category = isValidCategory(searchParams.category) ? searchParams.category : "public"
  const tab =
    searchParams.tab === "all" || isValidTab(searchParams.tab)
      ? (searchParams.tab ?? "all")
      : "all"

  const contentItemsRaw =
    category === "public"
      ? await prisma.contentItem.findMany({
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
          orderBy: { createdAt: "desc" },
        })
      : []

  // Show only one version per module (type + title); keep the most recent (first after desc sort)
  const seenKey = new Set<string>()
  const contentItems = contentItemsRaw.filter((item) => {
    const key = `${item.type}|${item.title}`
    if (seenKey.has(key)) return false
    seenKey.add(key)
    return true
  })

  const basePath = `/org/${params.slug}/trainer/content`
  const contentDescription =
    category === "internal"
      ? "Internal quality and training content (restricted access)"
      : "Manage your public training content"

  return (
    <div className="space-y-10">
      <PageHeader
        title="Content"
        description={contentDescription}
        action={
          category === "public" ? (
            <Button asChild>
              <Link href={tab !== "all" ? `${basePath}/new?type=${tab}` : `${basePath}/new`}>
                <Plus className="h-4 w-4" />
                Create Content
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Main category switcher: Internal | Public (Internal first, above) */}
      <div
        role="tablist"
        aria-label="Content category"
        className="inline-flex rounded-xl bg-muted/50 p-0.5"
      >
        {MAIN_CATEGORIES.map((c) => {
          const isActive = category === c.value
          const href = `${basePath}?category=${c.value}`
          const Icon = c.icon
          return (
            <Link
              key={c.value}
              href={href}
              role="tab"
              aria-selected={isActive}
              className={
                isActive
                  ? "rounded-lg bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-soft"
                  : "rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {c.label}
              </span>
            </Link>
          )
        })}
      </div>

      {category === "internal" && (
        <>
          <p className="text-sm text-muted-foreground">
            Internal content is restricted. Use the sections below to access QMS documents and
            competency records.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {INTERNAL_SUB_CATEGORIES.map((sub) => {
              const Icon = sub.icon
              return (
                <Link key={sub.value} href={sub.href(params.slug)}>
                  <Card className="h-full transition-colors hover:bg-muted/40">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{sub.label}</CardTitle>
                      </div>
                      <CardDescription>{sub.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {category === "public" && (
        <>
          <TabNav
            tabs={PUBLIC_TAB_ITEMS}
            currentValue={tab}
            basePath={`${basePath}?category=public`}
          />

          {contentItems.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                tab === "all"
                  ? "No content yet"
                  : `No ${PUBLIC_TAB_ITEMS.find((t) => t.value === tab)?.label?.toLowerCase() ?? tab} yet`
              }
              description="Create your first content item to get started."
              action={
                <Button asChild>
                  <Link
                    href={
                      tab !== "all"
                        ? `${basePath}/new?type=${tab}`
                        : `${basePath}/new`
                    }
                  >
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
                      <CardDescription>{item.type.replace("_", " ")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`${basePath}/${item.id}`}>View</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`${basePath}/${item.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
