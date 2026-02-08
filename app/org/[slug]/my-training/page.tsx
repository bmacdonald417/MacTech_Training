import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BookOpen, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface MyTrainingPageProps {
  params: { slug: string }
}

export default async function MyTrainingPage({ params }: MyTrainingPageProps) {
  const membership = await requireAuth(params.slug)

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: membership.userId,
      assignment: {
        orgId: membership.orgId,
      },
    },
    include: {
      assignment: {
        include: {
          contentItem: {
            include: {
              article: true,
              slideDeck: true,
              video: true,
              formTemplate: true,
              quiz: true,
              attestationTemplate: true,
            },
          },
          curriculum: {
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
          },
        },
      },
      itemProgress: {
        include: {
          contentItem: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-primary" />
      case "OVERDUE":
        return <AlertCircle className="h-5 w-5 text-amber-600" />
      default:
        return <BookOpen className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "border-emerald-200/80 bg-emerald-50/50"
      case "IN_PROGRESS":
        return "border-primary/20 bg-primary/5"
      case "OVERDUE":
        return "border-amber-200/80 bg-amber-50/50"
      default:
        return ""
    }
  }

  const calculateProgress = (enrollment: any) => {
    if (enrollment.assignment.type === "CONTENT_ITEM") {
      return enrollment.status === "COMPLETED" ? 100 : 0
    }

    // For curriculum
    const totalItems = enrollment.assignment.curriculum?.sections.reduce(
      (acc: number, section: any) => acc + section.items.length,
      0
    ) || 0

    const completedItems = enrollment.itemProgress.filter(
      (p: any) => p.completed
    ).length

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="My Training"
        description="View and complete your assigned training"
      />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No training assignments yet"
          description="When your admin assigns training, it will appear here."
        />
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment) => {
            const progress = calculateProgress(enrollment)
            const isContentItem = enrollment.assignment.type === "CONTENT_ITEM"
            const title = isContentItem
              ? enrollment.assignment.title
              : enrollment.assignment.curriculum?.title || enrollment.assignment.title

            return (
              <Card
                key={enrollment.id}
                className={cn(getStatusColor(enrollment.status), "transition-shadow duration-200")}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{title}</CardTitle>
                      {enrollment.assignment.description && (
                        <CardDescription className="mt-2">
                          {enrollment.assignment.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="ml-4">{getStatusIcon(enrollment.status)}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div>
                        {enrollment.assignment.dueDate && (
                          <span>
                            Due: {format(new Date(enrollment.assignment.dueDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      <div>
                        {enrollment.startedAt && (
                          <span>
                            Started: {format(new Date(enrollment.startedAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild>
                        <Link
                          href={`/org/${params.slug}/training/${enrollment.id}`}
                        >
                          {enrollment.status === "COMPLETED"
                            ? "Review"
                            : enrollment.status === "IN_PROGRESS"
                            ? "Continue"
                            : "Start"}
                        </Link>
                      </Button>
                    </div>
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
