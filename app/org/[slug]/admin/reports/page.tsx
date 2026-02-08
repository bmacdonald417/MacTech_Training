import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, BookOpen, Award, CheckCircle2, Download, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface ReportsPageProps {
  params: { slug: string }
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const membership = await requireAdmin(params.slug)

  // Get statistics
  const [
    totalUsers,
    totalAssignments,
    totalEnrollments,
    completedEnrollments,
    totalCertificates,
    overdueEnrollments,
    quizAttempts,
    passedQuizzes,
    failedQuizzes,
    curricula,
  ] = await Promise.all([
    prisma.membership.count({ where: { orgId: membership.orgId } }),
    prisma.assignment.count({ where: { orgId: membership.orgId } }),
    prisma.enrollment.count({
      where: {
        assignment: { orgId: membership.orgId },
      },
    }),
    prisma.enrollment.count({
      where: {
        assignment: { orgId: membership.orgId },
        status: "COMPLETED",
      },
    }),
    prisma.certificateIssued.count({
      where: {
        template: { orgId: membership.orgId },
      },
    }),
    prisma.enrollment.count({
      where: {
        assignment: { orgId: membership.orgId },
        status: "OVERDUE",
      },
    }),
    prisma.quizAttempt.count({
      where: {
        quiz: {
          contentItem: {
            orgId: membership.orgId,
          },
        },
      },
    }),
    prisma.quizAttempt.count({
      where: {
        quiz: {
          contentItem: {
            orgId: membership.orgId,
          },
        },
        passed: true,
      },
    }),
    prisma.quizAttempt.count({
      where: {
        quiz: {
          contentItem: {
            orgId: membership.orgId,
          },
        },
        passed: false,
      },
    }),
    prisma.curriculum.findMany({
      where: { orgId: membership.orgId },
      include: {
        assignments: {
          include: {
            enrollments: true,
          },
        },
      },
    }),
  ])

  const completionRate =
    totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0

  const quizPassRate =
    quizAttempts > 0
      ? Math.round((passedQuizzes / quizAttempts) * 100)
      : 0

  // Calculate completion rate by curriculum
  const curriculumStats = curricula.map((curriculum) => {
    const allEnrollments = curriculum.assignments.flatMap((a) => a.enrollments)
    const completed = allEnrollments.filter((e) => e.status === "COMPLETED").length
    const rate = allEnrollments.length > 0
      ? Math.round((completed / allEnrollments.length) * 100)
      : 0
    return {
      curriculum,
      total: allEnrollments.length,
      completed,
      rate,
    }
  })

  return (
    <div className="space-y-10">
      <PageHeader
        title="Reports"
        description="View organization training statistics"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedEnrollments} of {totalEnrollments} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCertificates}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Performance</CardTitle>
          <CardDescription>Overall quiz statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold">{quizAttempts}</div>
              <div className="text-sm text-gray-600">Total Attempts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{passedQuizzes}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{failedQuizzes}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-1">Pass Rate: {quizPassRate}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${quizPassRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Training */}
      {overdueEnrollments > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Overdue Training
            </CardTitle>
            <CardDescription>
              {overdueEnrollments} assignment{overdueEnrollments !== 1 ? "s" : ""} past due date
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Completion by Curriculum */}
      <Card>
        <CardHeader>
          <CardTitle>Completion by Curriculum</CardTitle>
          <CardDescription>Training completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          {curriculumStats.length === 0 ? (
            <p className="text-sm text-gray-600">No curricula yet.</p>
          ) : (
            <div className="space-y-4">
              {curriculumStats.map((stat) => (
                <div key={stat.curriculum.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{stat.curriculum.title}</span>
                    <span className="text-sm text-gray-600">
                      {stat.completed} / {stat.total} ({stat.rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${stat.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
