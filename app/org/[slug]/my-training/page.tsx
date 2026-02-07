import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
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
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-blue-600" />
      case "OVERDUE":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "border-green-200 bg-green-50"
      case "IN_PROGRESS":
        return "border-blue-200 bg-blue-50"
      case "OVERDUE":
        return "border-red-200 bg-red-50"
      default:
        return "border-gray-200 bg-white"
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Training</h1>
        <p className="mt-2 text-gray-600">
          View and complete your assigned training
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No training assignments yet.</p>
          </CardContent>
        </Card>
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
                className={getStatusColor(enrollment.status)}
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
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
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
