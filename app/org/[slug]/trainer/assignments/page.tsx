import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Plus, Users, Calendar } from "lucide-react"
import { format } from "date-fns"

interface AssignmentsPageProps {
  params: { slug: string }
}

export default async function AssignmentsPage({ params }: AssignmentsPageProps) {
  const membership = await requireTrainerOrAdmin(params.slug)

  const assignments = await prisma.assignment.findMany({
    where: { orgId: membership.orgId },
    include: {
      curriculum: true,
      contentItem: true,
      enrollments: {
        include: {
          user: true,
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
        title="Assignments"
        description="Manage training assignments"
        action={
          <Button asChild>
            <Link href={`/org/${params.slug}/trainer/assignments/new`}>
              <Plus className="h-4 w-4" />
              Create Assignment
            </Link>
          </Button>
        }
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assignments yet"
          description="Create an assignment to assign training to users or groups."
          action={
            <Button asChild>
              <Link href={`/org/${params.slug}/trainer/assignments/new`}>
                <Plus className="h-4 w-4" />
                Create assignment
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const totalEnrollments = assignment.enrollments.length
            const completedEnrollments = assignment.enrollments.filter(
              (e) => e.status === "COMPLETED"
            ).length

            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{assignment.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {assignment.type === "CURRICULUM"
                          ? `Curriculum: ${assignment.curriculum?.title}`
                          : `Content: ${assignment.contentItem?.title}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground">{assignment.description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {completedEnrollments} / {totalEnrollments} completed
                        </span>
                      </div>
                      {assignment.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/org/${params.slug}/trainer/assignments/${assignment.id}`}>
                          View Details
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
