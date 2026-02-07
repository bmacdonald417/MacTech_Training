import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Assignments
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage training assignments
          </p>
        </div>
        <Button asChild>
          <Link href={`/org/${params.slug}/trainer/assignments/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Link>
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No assignments yet.</p>
            <Button asChild>
              <Link href={`/org/${params.slug}/trainer/assignments/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Assignment
              </Link>
            </Button>
          </CardContent>
        </Card>
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
